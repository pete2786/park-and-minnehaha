# Park Ave & Minnehaha Parkway: Make It Safe

A single-page site that helps Minneapolis neighbors email the four officials responsible for the
Park Avenue & Minnehaha Parkway intersection, asking for an interim safety fix this summer and a
funded permanent redesign.

**Recipients:** Council Members Soren Stevenson (Ward 8) and Jamison Whiting (Ward 11); Park Board
Commissioners Kay Carvajal Moran (District 5) and Tom Olsen (At-Large). Each gets an individual,
pre-addressed email. Two more at-large commissioners are in the data but hidden by default.

## Editing the content
All copy lives in `data/campaign.json`: talking points, perspective openings, the ask, recipients,
subject line, and social text. Edit that file; no code changes needed. To show a hidden recipient,
set their `"shown": true`.

## Run locally
```bash
npm run serve      # python3 -m http.server 8080
# open http://localhost:8080
```
A server is required because the page fetches `data/campaign.json` (blocked on file://).

## Test
```bash
npm test           # node --test runs unit tests for js/compose.js, zero dependencies
```

## Images
`images/intersection-aerial.png` is the hero/aerial and the social-preview (OG) image. To swap it,
replace that file or update the `meta.ogImage` path in `data/campaign.json`. (It's ~3.6 MB; resizing to
~1200px wide would speed up load. Run `sips -Z 1200 images/intersection-aerial.png` on macOS.)

## Deploy
Static site on GitHub Pages. Push to `main`. See `CLAUDE.md` for the one-time setup and the
`__SITE_BASE__` meta-tag replacement.

## Privacy
No analytics, no backend, no third-party calls. Everything stays in the browser; data leaves only in
the email the sender chooses to send.
