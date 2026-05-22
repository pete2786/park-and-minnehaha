# Park & Minnehaha — architecture & workflow

Single-campaign civic engagement page. Adapted from Operation Defrost, simplified.

## Architecture
- No build tools. Vanilla HTML + Tailwind CDN. Deploy from `main` to GitHub Pages.
- `index.html` — shell + static OG/Twitter meta + empty containers; loads `js/app.js` (ES module).
- `js/compose.js` — PURE logic (no DOM): `shownRecipients`, `selectedFragments`, `composeEmailBody`,
  `buildMailtoUrl`. Imported by both the browser and `node --test`.
- `js/app.js` — DOM glue: fetches `data/campaign.json`, renders content, wires the widget, builds the
  per-recipient `mailto:` send checklist, and the share section.
- `data/campaign.json` — all content. This is the file you edit most.

## Email model
One individual email per recipient (no combined CC). Each recipient's `salutation` (from JSON) starts
the body; the rest of the body is shared across recipients. `mailto:` opens the sender's mail client.

## Tests
`npm test` runs `node --test` against `test/compose.test.js`. No dependencies — Node's built-in runner.
Add tests there when changing `js/compose.js`.

## Deploy (one-time)
1. `gh repo create <repo-name> --public --source=. --remote=origin --push`
2. Replace the `__SITE_BASE__` token in `index.html` with `https://pete2786.github.io/<repo-name>/`
   (this fixes the absolute OG/Twitter image + URL for social previews), commit, push.
3. In the repo: Settings → Pages → deploy from `main` (root). Wait for the Pages build.
4. The OG image (`images/intersection-aerial.png`) is best around 1200×630; resize if needed.

## Out of scope (v1)
Usage counter/tracking, multi-issue routing, before/after diagram, PDF, any backend. The send action
is isolated, so adding a counter later is a contained change.
