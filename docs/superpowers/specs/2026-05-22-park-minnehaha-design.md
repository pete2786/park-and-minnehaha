# Park & Minnehaha — Make the Intersection Safe

**Date:** 2026-05-22
**Status:** Draft for review
**Type:** Single-campaign civic engagement page (static site, GitHub Pages)

---

## 1. Summary

A focused, single-page web app that helps neighbors email Minneapolis City Council
Members **Soren Stevenson (Ward 8)** and **Jamison Whiting (Ward 11)** asking them to
prioritize a safety fix at the intersection of **Park Avenue and Minnehaha Parkway**.

Unlike its predecessor *Operation Defrost* (which targets a hostile federal audience and
must work across the political spectrum), this campaign is **friendly and collaborative**.
The council members are allies who have *asked* for emails — they need a visible volume of
constituent demand to make the case to Public Works, the Park Board, and other city leaders.

The app generates a personalized, ready-to-send email and opens it in the sender's email
client with one click. Everything runs in the browser. Nothing is collected.

## 2. The campaign

### The core ask (two tiers)

The intersection is **already named in the Minnehaha Parkway master plan**, but it sits
**unfunded and unscheduled**. We are not asking the council to invent anything new — we are
asking them to close the gap:

1. **Interim quick-build fix installed this summer** — paint, flex-posts, daylighting, and
   clearer markings to make the intersection safer *now*, while the permanent project is
   funded.
2. **Permanent concrete redesign funded and put on the calendar** — the lasting fix the
   master plan already envisions.

### The jurisdictional framing (why these two members can act)

This corner is a jurisdictional seam, and that seam is exactly why it has stalled:

- **Park Avenue is a city street**, city-owned up to about a block from the intersection.
- **The intersection itself is entirely Minneapolis Park & Recreation Board (MPRB) jurisdiction.**
- **But Minneapolis Public Works performs the actual work for *both* the city and the parks.**

So there is **no "not our department" excuse**. The same Public Works crews build for both
sides. The only thing missing is funding and a place on the schedule — which is precisely
what Ward 8 and Ward 11 council members can push through the city's budget and Public Works
process.

### Win-win-win

The proposed improvements make the intersection safer for **kids/pedestrians, people on
bikes, AND drivers** — drivers currently face a confusing, ambiguous crossing; a clearer,
squared-up design helps them too. The email should make this an everyone-wins message, not
a cars-vs-bikes fight.

## 3. Recipients

| Ward | Member | Email | Office phone |
|------|--------|-------|--------------|
| 8 | Soren Stevenson | `soren.stevenson@minneapolismn.gov` | 612-673-2208 |
| 11 | Jamison Whiting | `jamison.whiting@minneapolismn.gov` | 612-673-2211 |

*(Verified from the official City of Minneapolis council member pages on 2026-05-22.)*

A **Ward 8 / Ward 11 / Both** selector replaces Operation Defrost's ZIP-code rep lookup.
**Default: Both** — the intersection is the boundary seam between the two wards. The selected
members' addresses populate the email `To:` field.

## 4. Architecture

Same proven, dependency-free bones as Operation Defrost, simplified for a single campaign:

- **Pure vanilla HTML / CSS / JS + Tailwind CDN. No build step.**
- **One page** (`index.html`). No hash router, no multi-issue index (single campaign).
- **Content lives in `data/campaign.json`** — talking points, perspectives, recipients, the
  ask, and email template are all editable without touching app logic ("data-driven").
- **Deployed via GitHub Pages** from `main`. Push to main = deploy.
- **Hosting:** GitHub Pages project subpage (`pete2786.github.io/<repo>`). The site base URL
  is a single config constant so a custom domain is a one-line change later.

### What we keep from Operation Defrost
The no-build Tailwind setup, the JSON-driven content + email composition engine, the social
share block (copy URL + X/Facebook/Instagram), the GitHub Pages workflow.

### What we drop
- The multi-issue hash router and home/issue selector.
- The entire ZIP-code representative lookup (and its fragile CORS proxies).
- The per-issue social-sharing **stub redirect hack** — because this is a single static page,
  the OG/Twitter meta tags live directly in `<head>` and crawlers read them with no JS.

### What we add
- The Ward 8 / Ward 11 / Both recipient selector.
- "Who are you?" perspective framing + an optional free-text personal note.
- **One-click `mailto:` delivery** (with a copy-to-clipboard fallback).

## 5. Page layout (single column)

```
+-----------------------------------------------+
|  Park Ave & Minnehaha Parkway — Make it Safe  |  hero + aerial/map (placeholder)
+-----------------------------------------------+
|  THE PROBLEM  (the five angles, with photos)  |
|   * Daily route to Hale, Field, Justice Page  |
|     & Washburn — kids cross here every day     |
|   * The Park Ave bikeway -> Parkway trail seam |
|   * Drivers: one-way/two-way confusion, the    |
|     second parkway node, slingshot turns       |
|   * Walkers: no clear safe crossing            |
|   * One crew, one fix — no jurisdictional      |
|     excuse (city + MPRB, both built by         |
|     Minneapolis Public Works)                  |
+-----------------------------------------------+
|  THE ASK: already in the Parkway master plan — |
|  fund it. Interim fix this summer + permanent   |
|  concrete redesign scheduled & funded.          |
+-----------------------------------------------+
|  WRITE THE COUNCIL                             |
|   1. I am a... (.)parent ( )bike ( )drive       |
|                ( )walk ( )neighbor              |
|   2. Include: [x][x][x][x][x] the five points  |
|   3. Your note (optional): _________________    |
|   4. Your name + address (you're a constituent)|
|   5. Send to: ( )Ward 8 ( )Ward 11 (.)Both     |
|   ------  live email preview (subject+body) --- |
|   [ Open in your email app ]   [ Copy email ]   |
+-----------------------------------------------+
|  SHARE  (copy URL · X · Facebook · Instagram)  |
|  Footer: nothing is collected · who made it    |
+-----------------------------------------------+
```

## 6. Email composition engine

The composed email is assembled from these parts, in order:

1. **Greeting** — adapts to the selected recipients
   (e.g. "Dear Council Members Stevenson and Whiting," / "Dear Council Member Stevenson,").
2. **Opening line** — keyed to the chosen perspective (see §7).
3. **Selected talking points** — each included angle contributes one clean paragraph (§7).
4. **Personal note** — if the sender wrote one, it becomes its own paragraph. This is what
   makes each email real to the council.
5. **The ask** — master plan → interim fix this summer → funded permanent redesign.
6. **Closing + signature** — sender's name and address.

Placeholders (`[Your Name]`, `[Your Address]`) show in the live preview until filled, exactly
like Operation Defrost. The preview updates live as the sender toggles points, switches
perspective, edits the note, or changes recipients.

### Delivery
- **Primary:** an "Open in your email app" button builds a `mailto:` link with `to`
  (selected members, comma-separated), `subject`, and `body` pre-filled, URL-encoded.
- **Fallback:** a "Copy email" button copies the full body to the clipboard and shows the
  recipient address(es) so the sender can paste into any mail client / webmail.
- `mailto:` cannot confirm a send, and long bodies can hit client limits — the copy fallback
  covers both cases. We will keep the body within a sane length.

## 7. Content model (`data/campaign.json`)

> All copy below is **DRAFT** to establish structure and tone — refine during implementation
> and with the user. The schema is the contract; the words are placeholders to react to.

```jsonc
{
  "campaign": {
    "title": "Park Ave & Minnehaha Parkway — Make It Safe",
    "subtitle": "A friendly, urgent ask to fix a dangerous intersection",
    "intersection": "Park Avenue & Minnehaha Parkway, Minneapolis"
  },

  "recipients": [
    { "id": "ward8",  "ward": 8,  "name": "Soren Stevenson",
      "email": "soren.stevenson@minneapolismn.gov", "salutation": "Council Member Stevenson" },
    { "id": "ward11", "ward": 11, "name": "Jamison Whiting",
      "email": "jamison.whiting@minneapolismn.gov", "salutation": "Council Member Whiting" }
  ],
  "defaultRecipients": ["ward8", "ward11"],

  "perspectives": [
    { "id": "parent",   "label": "Parent",
      "opening": "As a parent of kids who travel through Park Ave and Minnehaha Parkway, I am writing to ask you to make this intersection safe." },
    { "id": "bike",     "label": "Person who bikes",
      "opening": "As someone who bikes through the Park Ave and Minnehaha Parkway intersection, I am writing to ask you to make it safe." },
    { "id": "drive",    "label": "Driver",
      "opening": "As someone who drives through the Park Ave and Minnehaha Parkway intersection, I am writing because it is confusing and dangerous and needs to be fixed." },
    { "id": "walk",     "label": "Person who walks",
      "opening": "As someone who walks through the Park Ave and Minnehaha Parkway intersection, I am writing to ask you to make it safe to cross." },
    { "id": "neighbor", "label": "Neighbor",
      "opening": "As a neighbor near Park Ave and Minnehaha Parkway, I am writing to ask you to make this intersection safe." }
  ],
  "defaultPerspective": "parent",

  "talkingPoints": [
    { "id": "schools", "label": "A daily route to four schools",
      "defaultSelected": true,
      "fragment": "This intersection is a daily route to Hale Elementary, Field Elementary, Justice Page Middle School, and Washburn High School. Kids cross here every single day, and the current design makes that crossing dangerous and stressful for them and their families." },
    { "id": "bike", "label": "The Park Ave bikeway to Parkway trail seam",
      "defaultSelected": true,
      "fragment": "This is a primary connection between the Park Avenue bike facilities and the Minnehaha Parkway trail system. A major link in our bike network should be one of the clearest, safest intersections in the city — instead it is confusing, unmarked, and frankly dangerous." },
    { "id": "drivers", "label": "Confusing and fast for drivers",
      "defaultSelected": true,
      "fragment": "Even for drivers this intersection fails. People cannot tell whether it is one-way or two-way, the second parkway node adds confusion, and the intersection is so wide that left-turning cars cut the corner badly and right-turning cars take the turn at 45 to 50 degrees — almost a slingshot — instead of a safe 90-degree turn. A clearer, squared-up design makes it safer for drivers too." },
    { "id": "pedestrians", "label": "No safe way to cross on foot",
      "defaultSelected": true,
      "fragment": "There is no clear, safe way for a person on foot to get from one side to the other. Crossings are unmarked and the distances are long and exposed." },
    { "id": "jurisdiction", "label": "One crew, one fix — no jurisdictional excuse",
      "defaultSelected": true,
      "fragment": "Park Avenue is a city street up to about a block from the intersection, and the intersection itself is Park Board land — but Minneapolis Public Works does the work for both the city and the parks. There is no jurisdictional wall here, only a gap in funding and scheduling. You are exactly the people who can close that gap." }
  ],

  "ask": {
    "summary": "This intersection is already named in the Minnehaha Parkway master plan, but it is unfunded and unscheduled. I am asking you to:",
    "items": [
      "Get an interim quick-build safety fix (paint, flex-posts, daylighting, clear markings) installed this summer.",
      "Fund the permanent concrete redesign the master plan envisions and put it on the schedule."
    ],
    "closing": "This is a rare win-win-win: a safer intersection for kids and people walking, a real bike-network connection, and a clearer, safer crossing for drivers. Thank you for championing it."
  },

  "emailDefaults": {
    "subject": "Please prioritize a safety fix at Park Ave & Minnehaha Parkway"
  },

  "meta": {
    "ogTitle": "Park Ave & Minnehaha Parkway — Make It Safe",
    "ogDescription": "Email Minneapolis City Council to fix a dangerous intersection for kids, people on bikes, walkers, and drivers.",
    "ogImage": "images/intersection-aerial.jpg",
    "shareText": "Help make the Park Ave & Minnehaha Parkway intersection safe — email Minneapolis City Council in one click."
  }
}
```

### Schools (canonical names)
Hale Elementary, Field Elementary, Justice Page Middle School, Washburn High School.

## 8. Sharing & SEO

- Static OG/Twitter meta tags in `index.html <head>` (no JS rendering, no stub redirect).
- One OG image (the aerial/map or a campaign card), ~1200px wide.
- Reuse Operation Defrost's share block: copy URL, X, Facebook, and "copy for Instagram."

## 9. Images / artifacts

- **v1 uses placeholders.** Scaffold `images/` with clearly-labeled placeholder files for:
  - `intersection-aerial.jpg` — hero aerial/map (also the OG image).
  - `danger-*.jpg` — ground-level photos illustrating the four problem angles.
- The user will supply real images later; dropping files into `images/` with the same names
  is the only step.
- Designed-but-deferred slots (not v1): before/after concept diagram, downloadable one-pager
  PDF, crash/traffic data.

## 10. Out of scope for v1

- **Usage counter / tracking.** Deliberately omitted to keep the site fully static, with no
  third-party dependency and nothing collected. Revisit only if there's a clear need.
- Multi-issue platform / router.
- ZIP-code representative lookup.
- Before/after diagram, one-pager PDF, embedded data.
- Any backend.

### Future hook
The send action (mailto open / copy) will be a single function, so adding an isolated,
privacy-respecting counter later — if ever wanted — is a small, contained change rather than
a re-architecture.

## 11. File structure

```
index.html              # The page + compose/share engine
data/campaign.json      # All editable content (recipients, perspectives, points, ask, meta)
images/                 # Placeholder hero + danger photos (real ones dropped in later)
CNAME                   # (only if/when a custom domain is added)
README.md               # What it is, how to edit content, how to deploy
CLAUDE.md               # Architecture + workflow notes for future sessions
docs/superpowers/specs/ # This spec
```

## 12. Privacy

No analytics, no tracking, no backend, no third-party calls at all. Everything — perspective,
note, name, address — stays in the browser and only ever leaves via the email the sender
themselves opens/sends. The footer states this plainly.

## 13. Local dev & deploy

- Local: `python3 -m http.server 8080` then open `http://localhost:8080` (needed because the
  page fetches `data/campaign.json`, which `file://` blocks).
- Deploy: push to `main`; GitHub Pages serves the site. Repo to be created under `pete2786`.

## 14. Testing (manual checklist)

- "Open in your email app" opens a mail client with correct To / Subject / Body.
- "Both" puts both addresses in To; Ward 8 / Ward 11 each put the single correct address.
- Greeting and recipient list update with the ward selector.
- Toggling each talking point adds/removes its paragraph in the live preview.
- Switching perspective changes the opening line.
- Typing a personal note inserts it as its own paragraph; empty note omits it cleanly.
- Name/address placeholders show until filled, then populate the signature.
- "Copy email" copies the body and surfaces the recipient address(es).
- Social share buttons open with the correct URL and text; OG tags render in a link preview.
- Layout is usable on mobile and desktop.

## 15. Open content items (not blockers to building)

- Real images for `images/` (user will supply; placeholders until then).
- A copy/tone pass on the draft talking points, perspective openings, and the ask.
- Final repo name under `pete2786` (sets the GitHub Pages base URL).
- Optional: confirm exact master-plan reference wording the user wants to cite.
