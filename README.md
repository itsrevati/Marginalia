# Marginalia

A 10-minute daily freewriting practice: a fresh topic each day, a timer, a
place to write with pasting turned off, and a "Voice Lab" that reads your
accumulated entries and reports back on your sentence rhythm, recurring
words, favored moves, and what to push on next.

It's a static site — no build step, no server, no database. Everything you
write stays in your browser's local storage on whichever device you use it
from.

## Quickstart

Open `index.html` directly, or serve the folder so relative paths and fonts
behave normally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Works with zero setup — topics come from a curated local bank
(`js/topicBank.js`) until you add an API key.

## Turning on AI-generated topics and voice analysis

1. Get a key at [console.anthropic.com](https://console.anthropic.com/) and
   add a small amount of prepaid credit (the Anthropic API is billed
   separately from any claude.ai subscription).
2. Open the app → **Settings** → paste the key in. It's saved only in this
   browser's `localStorage` — it is never written into any file in this
   repo, never committed to git, and never sent anywhere except
   `api.anthropic.com`.
3. Optionally set a spending cap on your Anthropic account as a safety net.
   With Claude Haiku (the default model), a daily topic plus occasional
   analysis runs well under $1/month.

### Why the key lives in the browser, not the repo

This is a static site with no backend, so there's nowhere to hide a secret
— anything shipped in the deployed files is visible to anyone who opens dev
tools on the page. Pasting your key into Settings keeps it local to your
own browser instead of baking it into the code that gets deployed.

**Consequence:** your key and your entries do not sync across devices or
browsers. If you switch machines, use **Settings → Export entries** to
download a JSON backup and **Import entries** on the other side. Your
Anthropic key itself is *not* included in exports (re-enter it wherever you
use the app) — only your writing and past analyses are.

## Deploying to GitHub Pages

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/marginalia.git
git push -u origin main
```

Then in the repo on GitHub: **Settings → Pages → Deploy from a branch →
`main` / root**. Your site will be live at
`https://<you>.github.io/marginalia/` within a minute or two.

Because the API key lives in browser storage rather than the deployed
files, this is safe to keep in a public repo — nothing secret ever leaves
your machine.

## Customizing what it tracks

This is the part built for you to edit directly.

- **`js/analysisConfig.js`** — the list of things Voice Lab looks for. Each
  entry becomes one instruction sent to Claude and one card in the
  dashboard. Add a parameter, remove one, or rewrite the instructions to
  focus on something else entirely (imagery, argument structure, humor,
  whatever you want tracked). Nothing else needs to change — the prompt and
  the dashboard are both built from this array.
- **`js/topicBank.js`** — the offline fallback topic list, organized by
  `mode` (`concrete`, `abstract`, `phrase`, `pair`, `reframe`). Add your own
  topics or modes; if you add a new mode, also add a label for it in
  `MODE_LABELS` in `js/topics.js`.
- **`js/topics.js`** — `buildTopicPrompt()` is the instruction sent to
  Claude when generating a topic with AI. It already feeds in your recent
  topics (to avoid repeats) and your latest Voice Lab analysis (so it can
  deliberately push against a pattern it noticed). Adjust the framing here
  if you want topics to skew a particular direction.
- **`js/analysis.js`** — `computeLocalStats()` is a small set of free,
  non-AI stats (word counts, average sentence length, top words) shown at
  the top of Voice Lab regardless of whether AI is on. Extend it if you
  want more mechanical stats alongside the qualitative ones.

## How your data is structured

Everything is plain JSON in `localStorage`:

- `freewrite.entries` — every saved entry: date, topic, text, word count,
  time spent.
- `freewrite.analyses` — every Voice Lab run, with the parameters Claude
  returned and which entries it covered.
- `freewrite.settings` — your API key, model choice, session length, and
  analysis reminder frequency.

See the top of `js/storage.js` for the exact shapes if you want to script
against your own data.

## Notes

- Pasting into the writing box is disabled on purpose — the practice is
  writing from recollection and invention, not transcription.
- The timer counts into negative time instead of stopping at zero, so
  running over doesn't cut off a thought mid-sentence.
- "Voice Lab" needs at least 3 entries before it will run, and by default
  looks at your most recent 15 (see `runAnalysis({ windowSize })` in
  `js/analysis.js` if you want a longer or shorter window).
