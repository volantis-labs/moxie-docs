# Video brief for the Moxie docs

This brief is for the media team. It lists the tutorial videos that the docs pages show.

## Rules for all videos

- Length: 60 to 120 seconds. One subject for each video.
- Language: English voice. Show the app in English.
- Show only what the released app does. Check each step against the build before you record.
- Start with the result in the first 5 seconds. Then show the steps.
- Record at 16:9, 1080p minimum. Use a clean Mac desktop and demo data. Do not show real names, real email addresses or real meetings.
- Upload to the Moxie YouTube channel as public or unlisted.
- Upload subtitle files to YouTube in 4 languages: English, German, French, Dutch (`.srt` or `.vtt`). The docs page starts the player with the subtitles of the page language.
- Make one poster image for each video: 16:9, 1440 px wide, JPG or WebP, no play button in the image.

## What to deliver for each video

| Item | Example |
| --- | --- |
| Feature key (from the table below) | `recording` |
| YouTube id (the 11 characters after `v=` in the video URL) | `AbCdEfGh123` |
| Poster image, named with the key | `recording.jpg` |
| Subtitles on YouTube | en, de, fr, nl |

To publish a video in the docs, set the id and the poster in `src/data/videos.json` and put the poster in `src/assets/posters/`:

```json
"recording": { "id": "YOUTUBE_ID", "poster": "recording.jpg" }
```

## Feature videos

| Key | Title | Show | Docs pages |
| --- | --- | --- | --- |
| `first-meeting` | Install Moxie and record your first meeting | Install, sign in, permissions, first recording, the note after the meeting | Install Moxie · Your first meeting |
| `speakers` | Speakers and your voice profile | Record the voice profile, rename a speaker, name suggestions | Speakers and voice profile |
| `enhanced-notes` | Enhanced notes and templates | Make enhanced notes, change the template, open a citation | Enhanced notes and templates |
| `search` | Find a note | Open search, find a note, a person, and words in an image | Search |
| `chat` | Ask questions about your meetings | Chat in one note, chat across all notes, citations | Chat |
| `export` | Export your notes | Export one note, export many notes, the file formats | Export |
| `mcp` | Let an AI agent read your notes | Turn on agent access, copy the MCP config, one question from an agent | MCP server |

## Trick videos

These 7 videos come from ticket WF-775 in the Moxie tracker. That ticket holds the full list of tricks for each group.

| Key | Title | Show | Docs pages |
| --- | --- | --- | --- |
| `recording` | Recording | Meeting prompt, floating control, sound meters, Stop, the "…" menu, questions during a meeting | Start and stop a recording · The recording control |
| `editor-formatting` | Formatting and the slash menu | Markdown typing, text shortcuts, slash menu, note templates | Format as you type · Slash menu |
| `editor-lists` | Lists and checklists | Bullets, numbers, checklist toggle, indent, fold | Lists and checklists |
| `editor-links-mentions` | Links and mentions | Link to a URL, link to a note, `@` mention, person page | Links · Mention people |
| `editor-find-replace` | Find and replace | Find bar, next and previous match, Replace, Replace all | Find and replace |
| `editor-tables-images` | Tables and images | Type a table, cell menu, paste a table, paste and drop an image | Tables · Images |
| `editor-citations` | Transcript and citations | Find in transcript, open a citation, transcript pane | Citations and Find in transcript |
