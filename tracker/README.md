# Tracker

A tiny personal ticket tracker: one SQLite file, a JSON API, a one-page web app (Kanban, dependency graph, epics) and a CLI for agents. Node 24 LTS (the version in the repository's `.node-version`; `node:sqlite` is built in), zero npm dependencies, no build step. Everything works offline.

## Run

```sh
cd tracker
node --no-warnings server.mjs        # or: npm start
open http://localhost:4712
```

| Env var          | Default                   | Meaning                                  |
|------------------|---------------------------|------------------------------------------|
| `TRACKER_PORT`   | `4712`                    | HTTP port                                |
| `TRACKER_PREFIX` | `DOCS`                     | Ticket key prefix, keys are `DOCS-1`, `DOCS-2`, ... |
| `TRACKER_DB`     | `tracker/data/tracker.db` | SQLite file, created on first run (WAL)  |

Tests: `npm test` (runs `node --no-warnings --test test.mjs` against a temporary database).

The CLI reads and writes the database directly, so it works whether or not the server is running.

## Layout

```
tracker/
  server.mjs   HTTP server: serves index.html at / and the JSON API under /api
  db.mjs       the single data-access module (used by server, CLI and tests)
  schema.sql   tables, applied idempotently on every open (older databases are upgraded in place, see Migration)
  cli.mjs      node tracker/cli.mjs <command>
  index.html   the web app, vanilla JS and CSS, no external assets
  test.mjs     node:test suite
  data/        tracker.db lives here (gitignored)
```

## Data model

**Ticket**

| Field         | Notes                                                                 |
|---------------|-----------------------------------------------------------------------|
| `key`         | `<PREFIX>-<n>`, assigned sequentially from 1, never reused. The only name a ticket has. |
| `title`       | required, short                                                       |
| `description` | markdown, may be empty                                                |
| `status`      | `todo` (default), `in_progress`, `done`                               |
| `type`        | `story` (default), `bug`, `research`                                  |
| `epic`        | `E<n>` or null                                                        |
| `themes`      | array of lowercase strings (`mvp`, `speakers`, `perf`, `ux`), default `[]`. Trimmed, de-duplicated, order kept; the first theme colours the graph node |
| `labels`      | array of strings, default `[]`. Wayfinder stores its ticket kind here, e.g. `wayfinder:research` |
| `resolution`  | the recorded answer when a ticket is closed, or null                  |
| `created_at`, `updated_at`, `closed_at` | ISO timestamps. `closed_at` is set when status becomes `done` and cleared on reopen |

Derived on every read, never stored:

| Field        | Meaning                                                              |
|--------------|----------------------------------------------------------------------|
| `blocked_by` | keys of tickets this one waits on                                    |
| `blocks`     | keys of tickets waiting on this one                                  |
| `blocked`    | true when any ticket in `blocked_by` is not `done`                   |

The **frontier** is every ticket with status `todo` that is not blocked. Claiming a ticket means moving it to `in_progress`, which takes it off the frontier.

**Epic**: `id` (`E<n>`), `name`, `description` (markdown, may be long), `created_at`, `updated_at`. Responses also carry `counts: {todo, in_progress, done}`.

**Dependency**: `(ticket, blocked_by)` pairs. Self-dependencies and any edge that would create a cycle are rejected with a clear error. Deleting a ticket removes its edges.

There are no owners, assignees, teams, priorities or comments.

## Migration

Tickets used to have a single `theme` column, and MVP tickets kept their area as an `area:<x>` label. `db.mjs` upgrades such a database the first time it opens it, inside one `BEGIN IMMEDIATE` transaction, detected from `PRAGMA table_info(tickets)`, so it runs once and is safe when several processes open the database at the same time:

1. Add `themes` and `type`. Every existing ticket gets type `story`.
2. Set `themes` to the old `theme` followed by the part after the colon of every `area:` label, then remove the `area:` labels. Other labels, such as `wayfinder:*`, stay.
3. Drop the `theme` column.

Import applies the same conversion to any ticket in a dump that has no `themes` field (a version 1 dump).

## Naming rules

- A ticket is only ever referred to by its key (`DOCS-3`) and its title. Keys are case-insensitive on input and always returned uppercase.
- There are no phases, slices, sub-tickets or lettered hierarchies. If work needs splitting, create more tickets and wire dependencies.
- Every ticket has a type: `story` (work to build), `bug` (something broken), or `research` (a question to answer).
- Epics (`E1`) group work. Themes (`mvp`, `speakers`, `perf`) tag cross-cutting concerns; a ticket can have several. Labels carry anything else (`wayfinder:research`).

## JSON API

All responses are JSON. Errors are `{"error": "message"}` with status 400 (bad input), 404 (missing), 405 (wrong method), 409 (conflict), 413 (body too large). Epic ids are accepted as `E3` or `3` everywhere.

| Method   | Path                                     | Body / query                                                                   |
|----------|------------------------------------------|--------------------------------------------------------------------------------|
| `GET`    | `/api/health`                            |                                                                                |
| `GET`    | `/api/tickets`                           | query: `status`, `type`, `epic`, `theme` (tickets whose themes include it), `label`, `q` (substring of key/title/description), `blocked` (`true`/`false`) |
| `POST`   | `/api/tickets`                           | `{title, description?, status?, type?, epic?, themes?, labels?, blocked_by?: [keys]}` → 201 |
| `GET`    | `/api/tickets/:key`                      |                                                                                |
| `PATCH`  | `/api/tickets/:key`                      | any subset of `title, description, status, type, epic, themes, labels, resolution`. `themes` replaces the whole list. Unknown fields are rejected. |
| `POST`   | `/api/tickets/:key/move`                 | `{status}`                                                                     |
| `DELETE` | `/api/tickets/:key`                      |                                                                                |
| `POST`   | `/api/tickets/:key/blocked-by`           | `{key}` the blocker. Idempotent. 400 on self or cycle.                        |
| `DELETE` | `/api/tickets/:key/blocked-by/:blocker`  |                                                                                |
| `GET`    | `/api/frontier`                          | query: `epic`, `type`, `theme`                                                 |
| `GET`    | `/api/graph`                             | query: `epic`. `{nodes: [{key,title,status,type,themes,epic,blocked}], edges: [{from, to}]}`, edge from blocker to blocked |
| `GET`    | `/api/epics`                             |                                                                                |
| `POST`   | `/api/epics`                             | `{name, description?}` → 201                                                   |
| `GET`    | `/api/epics/:id`                         |                                                                                |
| `PATCH`  | `/api/epics/:id`                         | `{name?, description?}`                                                        |
| `DELETE` | `/api/epics/:id`                         | 409 if it still has tickets; `?force=true` deletes it and nulls their epic     |
| `GET`    | `/api/themes`                            | distinct themes across all tickets, sorted                                     |
| `GET`    | `/api/export`                            | full dump `{version: 2, exported_at, prefix, epics, tickets, dependencies}`    |
| `POST`   | `/api/import`                            | that dump, version 2 or version 1; replaces everything inside one transaction  |

Legacy alias: POST and PATCH also accept `theme` (a string, or null) and treat it as `themes` with that one value (or none). Giving both `theme` and `themes` is a 400. Responses never contain `theme`.

Examples:

```sh
curl -s -X POST localhost:4712/api/tickets -H 'content-type: application/json' \
  -d '{"title":"Pick a storage format","epic":"E1","type":"research","themes":["mvp","capture"],"labels":["wayfinder:research"]}'
curl -s -X PATCH localhost:4712/api/tickets/DOCS-3 -H 'content-type: application/json' -d '{"type":"bug","themes":["capture"]}'
curl -s 'localhost:4712/api/tickets?theme=speakers&type=research'
```

## CLI

`node tracker/cli.mjs <command> [args]`. Prints one JSON value to stdout. On failure prints `{"error": "..."}` to stdout and exits 1. `--description` and `--resolution` each accept a `--<name>-file path` alternative for long text.

| Command | Example |
|---------|---------|
| `create --title "..." [--description "..." \| --description-file p] [--epic E1] [--theme x]... [--type story\|bug\|research] [--label l]... [--blocked-by KEY]... [--status s]` | `node tracker/cli.mjs create --title "Pick a storage format" --epic E1 --type research --theme mvp --theme capture --label wayfinder:research` |
| `get KEY` | `node tracker/cli.mjs get DOCS-3` |
| `list [--status s] [--type t] [--epic E1] [--theme x] [--label l] [--q text] [--blocked true\|false]` | `node tracker/cli.mjs list --epic E1 --status todo --theme speakers` |
| `update KEY [--title] [--description \| --description-file] [--status] [--type t] [--epic E1\|none] [--themes a,b\|none] [--theme x\|none] [--add-theme x]... [--remove-theme x]... [--labels a,b] [--resolution \| --resolution-file]` | `node tracker/cli.mjs update DOCS-3 --type bug --add-theme perf --remove-theme ux` |
| `move KEY todo\|in_progress\|done` | `node tracker/cli.mjs move DOCS-3 in_progress` |
| `close KEY --resolution "..." \| --resolution-file p` | `node tracker/cli.mjs close DOCS-3 --resolution "JSONL, because it streams."` |
| `block KEY --by BLOCKER` | `node tracker/cli.mjs block DOCS-4 --by DOCS-3` |
| `unblock KEY --by BLOCKER` | `node tracker/cli.mjs unblock DOCS-4 --by DOCS-3` |
| `delete KEY` | `node tracker/cli.mjs delete DOCS-3` |
| `frontier [--epic E1] [--type t] [--theme x]` | `node tracker/cli.mjs frontier --epic E1 --type research` |
| `graph [--epic E1]` | `node tracker/cli.mjs graph --epic E1` |
| `epic create --name "..." [--description \| --description-file p]` | `node tracker/cli.mjs epic create --name "Capture pipeline" --description-file map.md` |
| `epic list` | `node tracker/cli.mjs epic list` |
| `epic get E1` | `node tracker/cli.mjs epic get E1` |
| `epic update E1 [--name] [--description \| --description-file p]` | `node tracker/cli.mjs epic update E1 --description-file map.md` |
| `epic delete E1 [--force]` | `node tracker/cli.mjs epic delete E1 --force` |
| `export [path]` | `node tracker/cli.mjs export tracker/backup.json` (stdout when no path) |
| `import path` | `node tracker/cli.mjs import tracker/backup.json` |

Themes on `update`: `--themes a,b` replaces the list and `--themes none` clears it. `--theme x` is the older form of `--themes x` (one theme), and `--theme none` also clears. `--add-theme` and `--remove-theme` can be repeated; they apply after any replacement, in one transaction. On `create`, repeat `--theme` for several themes.

## Wayfinding operations

How the [wayfinder skill](../.agents/skills/wayfinder/SKILL.md) maps onto this tracker.

| Wayfinder concept | Here |
|-------------------|------|
| **The map** (one issue labelled `wayfinder:map`, body = Destination / Notes / Decisions so far / Not yet specified / Out of scope) | An **epic**. Its `description` holds the whole map body. Create it with `epic create --name "<map name>" --description-file map.md`. Read it with `epic get E<n>`. |
| **Child tickets** of the map | Tickets in that epic: `create --title "..." --epic E<n> --label wayfinder:<type>`. The body (`## Question ...`) goes in `--description` / `--description-file`. |
| **Ticket type** (`research`, `prototype`, `grilling`, `task`) | The label `wayfinder:<type>` on the ticket. Filter with `list --epic E<n> --label wayfinder:research`. This is separate from the ticket's `type` field (`story`, `bug`, `research`). |
| **Claim** (assign before any work) | `move KEY in_progress`. There are no assignees; `in_progress` is the claim and takes the ticket off the frontier. An open ticket still in `todo` is unclaimed. |
| **Blocking** (native dependency) | `block KEY --by BLOCKER` after both exist (create first, wire in a second pass). Cycles are rejected. `unblock KEY --by BLOCKER` removes an edge. The Graph tab renders the frontier visually. |
| **Frontier** (open, unblocked, unclaimed) | `frontier --epic E<n>`, or `GET /api/frontier?epic=E<n>`. Ordered by key; take the first. |
| **Resolution** (answer recorded on close) | `close KEY --resolution "..."` or `--resolution-file answer.md`. Sets status `done`, stores the resolution, stamps `closed_at`. Read it back with `get KEY`. |
| **Append to "Decisions so far"** | Edit the map body and write it back: `epic get E<n>` → edit the `description` → `epic update E<n> --description-file map.md`. |
| **Zoom** into a closed ticket | `get KEY` returns description and resolution in full. |
| **Rule out of scope** | `close KEY --resolution "Out of scope: <why>"` and note it in the map's Out of scope section. |
| **Refer by name** | Every response carries `key` and `title`; narrate with the title and keep the key beside it. |

## Backup

In this repository `tracker/tracker.json` is committed and is the source of truth. The default database (`tracker/data/tracker.db`, gitignored) is a cache: opening it imports `tracker.json` whenever the file's hash differs from the last sync (a pull, a checkout, a fresh clone), and every committed write exports it back, without a timestamp so diffs show only real changes. Databases opened by path or through `TRACKER_DB` never sync. A running UI server imports only at start, so restart it after a pull. `node tracker/cli.mjs export tracker/backup.json` still writes an extra local dump. `node tracker/cli.mjs import tracker/backup.json` restores it, replacing everything atomically.
