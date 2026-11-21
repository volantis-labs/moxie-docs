# Moxie docs

The user documentation of Moxie, a meeting-notes app for the Mac. Live at https://volantislabs.dev/moxie/docs/.

- Product repo: `../wallflower` (code name Wallflower, product name Moxie).
- Main site repo: `../volantislabs.github.io` (serves `/moxie`, `/moxie/privacy`, `/moxie/terms`).
- Generator: Astro Starlight. Host: Cloudflare Worker `moxie-docs` with static assets, route `volantislabs.dev/moxie/docs*`. A push to `main` builds and deploys.

## Commands

```sh
npm run dev      # local site at http://localhost:4321/moxie/docs/
npm run build    # build to dist/, with the link check
npm run check    # translation and page-length checks
npm run preview  # wrangler dev: the built site, served as Cloudflare serves it
npm test         # check + tracker tests
```

## Commit rules

- Never attribute a commit to Claude, Codex or a coding agent.
- Author `volantis-dev`. Remote through the SSH alias `github-volantis`.
- A commit message starts with the ticket key: `DOCS-12: add the export page`.
- Commit `tracker/tracker.json` in the same commit as the work.

## Ticket tracker rules

The tracker in `tracker/` is the only place where work is planned and tracked.

- UI: `node --no-warnings tracker/server.mjs`, then open http://localhost:4712
- CLI, from the repo root: `node --no-warnings tracker/cli.mjs <command>`
- Reference: `tracker/README.md`, skill `.agents/skills/tracker/SKILL.md`

1. **No work without a ticket.** Search first: `list --q "<words>"`. Then `create --title "..." --epic E<n> --type story|bug|research --theme <theme>`.
2. **Claim before work.** `move DOCS-n in_progress`. If work stops, move the ticket to `todo` and add a progress note.
3. **Move the ticket when the state changes.** Move to done only after verification.
4. **The ticket is the record.** The description holds the goal, the acceptance criteria and the decisions.
5. **Close with a resolution.** `close DOCS-n --resolution "..."`: what was done, how it was verified, which tickets hold the remaining work.
6. **Split, never nest.** A ticket too large for one session becomes more tickets with dependencies.
7. **Each ticket has an epic, a type and a theme.** Themes: `infra`, `content`, `i18n`, `video`, `design`.
8. **Dependencies are real.** `block DOCS-n --by DOCS-m`. Pick the next ticket from `frontier`.
9. **Delete only duplicates and mistakes.** Close all others with `Out of scope: <why>`.

Epics: E1 Foundation, E2 English content, E3 Translation, E4 Video, E5 Launch.

## Writing rules

- Write in ASD-STE100 Simplified Technical English: short sentences, active voice, one instruction in each step.
- One task for each page. A maximum of approximately 200 words of text, code blocks not included. `npm run check` gives a warning above 300 words.
- Order on a page: video (if there is one), one sentence that gives the result, numbered steps, example, related pages.
- Each page has a minimum of one example: a code block, a key or menu path, or a screenshot.
- Write UI names exactly as the app shows them, in bold: **Settings → Your data → Backup**.
- Write a shortcut with key symbols in a `<kbd>` tag: `<kbd>⇧⌘S</kbd>`. Use the Apple order of modifier keys: ⌃ ⌥ ⇧ ⌘. Symbols need no translation.
- Write a link to another docs page as an absolute path with the base and an end slash: `/moxie/docs/editor/tables/`. In a translated page, add the language: `/moxie/docs/de/editor/tables/`. The build fails on a broken link.
- Model page: `src/content/docs/editor/formatting.mdx`.
- Do not write "we collect no data". Write what stays on the Mac.
- Do not document features that the app does not have. Check each statement against `../wallflower`.

Sources for content:

- App strings: `../wallflower/app/src/shared/i18n/{en,de,fr,nl}.json`
- Glossary and register: `../wallflower/scripts/i18n-style.mjs` (formal: Sie, vous, u)
- Settings and defaults: `../wallflower/app/src/shared/settings.ts`
- CLI and MCP: `../wallflower/native/rust/cli/src/`
- Tips and tricks of the editor and of recording: ticket WF-775 in `../wallflower/tracker/tracker.json`
- Do not use `../wallflower/docs/settings.md`. It is out of date.

## Languages

- English is the source. Files are in `src/content/docs/`. Translations are in `src/content/docs/{de,fr,nl}/` with the same file names.
- Each translated page has `sourceHash` in its front matter. Get the value with `npm run check -- --hash <english file>`.
- When you change an English page, update the 3 translations and their `sourceHash` in the same commit.

## Videos

- A page shows a video with `<Video feature="record" />`.
- `src/data/videos.json` maps each feature key to a YouTube id and a poster file in `src/assets/posters/`. An empty id shows nothing.
- No request goes to YouTube before the reader clicks play. Do not add a YouTube thumbnail URL, a preconnect or an iframe to a page.
