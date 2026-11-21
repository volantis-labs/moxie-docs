---
name: tracker
description: Record and work tickets on this repo's local tracker (tracker/cli.mjs), so every piece of work has a DOCS-<n> key, a claim, dependencies and a recorded resolution.
---

The repo's issue tracker is `tracker/`: SQLite, a JSON API on `http://localhost:4712`, and a CLI. Use the CLI. It talks to the database directly and works with or without the server running. Every command prints one JSON value to stdout; on failure it prints `{"error": "..."}` and exits 1. Full docs: `tracker/README.md`.

Only the root session runs the CLI, from the canonical primary checkout, under `.agents/workflow.md`. Delegated workers receive a fresh `get` snapshot and report deltas; they never run CLI commands or alter tracker exports. Running the CLI in a ticket worktree would mutate that worktree's `tracker/tracker.json`, so it is prohibited for workers.

Run every command from the primary repo root as `node --no-warnings tracker/cli.mjs <command>`.

## Naming rules

- A ticket is referred to only by its key (`DOCS-3`) and its title. Never invent other names, numbers or slugs.
- No phases, slices, sub-tickets or lettered hierarchies. More work means more tickets plus dependencies.
- Every ticket has a type: `story` (the default), `bug`, or `research`.
- Epics (`E1`) group work. Themes (`mvp`, `speakers`, `perf`) tag cross-cutting concerns; every ticket should have one or more. Labels carry anything else, such as `wayfinder:research`.

## When to create a ticket

Create one when a unit of work or a decision should outlive this session: something a later session picks up, something the human wants to see on the board, or a question another ticket depends on. Do not create tickets for steps you will finish in the next few minutes.

```sh
node --no-warnings tracker/cli.mjs create --title "Pick a storage format" --epic E1 --type research --theme mvp --theme capture --label wayfinder:research --description-file question.md
```

Wire dependencies after both tickets exist (create first, wire second):

```sh
node --no-warnings tracker/cli.mjs block DOCS-4 --by DOCS-3      # DOCS-4 waits on DOCS-3
node --no-warnings tracker/cli.mjs unblock DOCS-4 --by DOCS-3
```

Self-dependencies and cycles are rejected.

## Claim before working

Find what is takeable, then claim it before doing anything else. `in_progress` is the claim; other sessions skip it.

```sh
node --no-warnings tracker/cli.mjs frontier --epic E1          # open, unblocked, unclaimed
node --no-warnings tracker/cli.mjs move DOCS-3 in_progress      # claim
node --no-warnings tracker/cli.mjs get DOCS-3                   # full body, blockers, resolution
```

## Close with a resolution

Closing records the answer. Always give one; a bare `move KEY done` loses the reason.

```sh
node --no-warnings tracker/cli.mjs close DOCS-3 --resolution "JSONL, because it streams and diffs well."
node --no-warnings tracker/cli.mjs close DOCS-3 --resolution-file answer.md
```

If a ticket turns out to be out of scope, close it with a resolution that starts with `Out of scope:`.

## Other commands you will need

```sh
node --no-warnings tracker/cli.mjs list --epic E1 --status todo
node --no-warnings tracker/cli.mjs list --label wayfinder:research --blocked false
node --no-warnings tracker/cli.mjs list --theme speakers --type bug
node --no-warnings tracker/cli.mjs update DOCS-3 --title "..." --labels wayfinder:grilling,decided
node --no-warnings tracker/cli.mjs update DOCS-3 --type bug --add-theme perf --remove-theme ux
node --no-warnings tracker/cli.mjs update DOCS-3 --themes mvp,speakers   # replace; --themes none clears
node --no-warnings tracker/cli.mjs graph --epic E1              # {nodes, edges}, edge from blocker to blocked
node --no-warnings tracker/cli.mjs epic create --name "Capture pipeline" --description-file map.md
node --no-warnings tracker/cli.mjs epic get E1
node --no-warnings tracker/cli.mjs epic update E1 --description-file map.md
node --no-warnings tracker/cli.mjs export tracker/backup.json  # extra local dump; tracker/tracker.json is the committed state and syncs automatically
```

For wayfinder maps: the map is an epic whose description is the map body; its tickets carry `wayfinder:<type>`; see "Wayfinding operations" in `tracker/README.md`.
