# Park & Minnehaha Intersection Safety Campaign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, no-build static site that lets neighbors send an individually-addressed email to each of four Minneapolis officials (2 City Council, 2 Park Board) asking them to fix the Park Ave & Minnehaha Parkway intersection.

**Architecture:** Pure vanilla HTML + Tailwind CDN, no bundler. All campaign copy lives in `data/campaign.json`. The logic-heavy core (recipient filtering, email-body assembly, `mailto:` URL building) is a dependency-free ES module (`js/compose.js`) imported by both the browser (`js/app.js`) and Node's built-in test runner. The DOM glue (`js/app.js`) fetches the JSON, renders the page, and wires the compose widget + per-recipient send checklist.

**Tech Stack:** HTML5, Tailwind (CDN), vanilla ES modules, Node `node:test` + `node:assert` (built in, zero npm install) for unit tests, Python `http.server` for local dev, GitHub Pages for hosting.

**Spec:** `docs/superpowers/specs/2026-05-22-park-minnehaha-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `index.html` | Markup, Tailwind CDN, static OG/Twitter meta, empty containers, loads `js/app.js` as a module |
| `js/compose.js` | **Pure** logic (no DOM): `shownRecipients`, `selectedFragments`, `composeEmailBody`, `buildMailtoUrl`. Runs in browser + Node. |
| `js/app.js` | DOM glue: fetch `campaign.json`, render hero/problem/ask, wire the widget, live preview, send checklist, share section |
| `data/campaign.json` | All editable content (campaign, recipients, perspectives, talking points, ask, email defaults, meta) |
| `images/intersection-aerial.svg` | Placeholder hero/aerial image (user swaps for a real JPG later) |
| `test/compose.test.js` | `node:test` unit tests for `js/compose.js` |
| `package.json` | `{"type":"module"}` + `test`/`serve` scripts. **No dependencies.** |
| `README.md` | What it is, how to edit content, run, test, deploy |
| `CLAUDE.md` | Architecture + workflow notes for future sessions |

**Composed email body format** (the contract every task relies on):

```
{salutation},

{perspective opening}

{talking-point fragment 1}

{talking-point fragment 2}
… (one blank line between each)

{personal note}          ← only present if the sender typed one

{ask.summary}
- {ask.item 1}
- {ask.item 2}

{ask.closing}

Sincerely,
{name or "[Your Name]"}
{address or "[Your Address]"}
```

The `salutation` already contains the "Dear …" prefix (from JSON); `composeEmailBody` appends the comma. Blocks are joined with `\n\n`.

---

## Task 1: Scaffold project, content data, and placeholder image

**Files:**
- Create: `package.json`
- Create: `data/campaign.json`
- Create: `images/intersection-aerial.svg`

- [ ] **Step 1: Create `package.json`** (no dependencies; `type: module` lets Node treat `.js` as ESM)

```json
{
  "name": "park-and-minnehaha",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Single-page campaign to fix the Park Ave & Minnehaha Parkway intersection",
  "scripts": {
    "test": "node --test",
    "serve": "python3 -m http.server 8080"
  }
}
```

- [ ] **Step 2: Create `data/campaign.json`** with the full campaign content

```json
{
  "campaign": {
    "title": "Park Ave & Minnehaha Parkway — Make It Safe",
    "subtitle": "A friendly, urgent ask to fix a dangerous intersection",
    "intersection": "Park Avenue & Minnehaha Parkway, Minneapolis"
  },
  "recipients": [
    { "id": "ward8",     "body": "City Council", "role": "Ward 8",     "name": "Soren Stevenson",
      "email": "soren.stevenson@minneapolismn.gov", "salutation": "Dear Council Member Stevenson", "shown": true },
    { "id": "ward11",    "body": "City Council", "role": "Ward 11",    "name": "Jamison Whiting",
      "email": "jamison.whiting@minneapolismn.gov", "salutation": "Dear Council Member Whiting", "shown": true },
    { "id": "moran",     "body": "Park Board",   "role": "District 5", "name": "Kay Carvajal Moran",
      "email": "kmoran@minneapolisparks.org", "salutation": "Dear Commissioner Carvajal Moran", "shown": true },
    { "id": "olsen",     "body": "Park Board",   "role": "At-Large",   "name": "Tom Olsen",
      "email": "tolsen@minneapolisparks.org", "salutation": "Dear Commissioner Olsen", "shown": true },
    { "id": "forney",    "body": "Park Board",   "role": "At-Large",   "name": "Meg Forney",
      "email": "mforney@minneapolisparks.org", "salutation": "Dear Commissioner Forney", "shown": false },
    { "id": "frederick", "body": "Park Board",   "role": "At-Large",   "name": "Amber A. Frederick",
      "email": "afrederick@minneapolisparks.org", "salutation": "Dear Commissioner Frederick", "shown": false }
  ],
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
    { "id": "schools", "label": "A daily route to four schools", "defaultSelected": true,
      "fragment": "This intersection is a daily route to Hale Elementary, Field Elementary, Justice Page Middle School, and Washburn High School. Kids cross here every single day, and the current design makes that crossing dangerous and stressful for them and their families." },
    { "id": "bike", "label": "The Park Ave bikeway to Parkway trail seam", "defaultSelected": true,
      "fragment": "This is a primary connection between the Park Avenue bike facilities and the Minnehaha Parkway trail system. A major link in our bike network should be one of the clearest, safest intersections in the city — instead it is confusing, unmarked, and frankly dangerous." },
    { "id": "drivers", "label": "Confusing and fast for drivers", "defaultSelected": true,
      "fragment": "Even for drivers this intersection fails. People cannot tell whether it is one-way or two-way, the second parkway node adds confusion, and the intersection is so wide that left-turning cars cut the corner badly and right-turning cars take the turn at 45 to 50 degrees — almost a slingshot — instead of a safe 90-degree turn. A clearer, squared-up design makes it safer for drivers too." },
    { "id": "pedestrians", "label": "No safe way to cross on foot", "defaultSelected": true,
      "fragment": "There is no clear, safe way for a person on foot to get from one side to the other. Crossings are unmarked and the distances are long and exposed." },
    { "id": "jurisdiction", "label": "One crew, one fix — no jurisdictional excuse", "defaultSelected": true,
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
    "ogDescription": "Email Minneapolis City Council and Park Board to fix a dangerous intersection for kids, people on bikes, walkers, and drivers.",
    "ogImage": "images/intersection-aerial.svg",
    "shareText": "Help make the Park Ave & Minnehaha Parkway intersection safe — email Minneapolis City Council and Park Board in one click."
  }
}
```

- [ ] **Step 3: Create `images/intersection-aerial.svg`** (text-authorable placeholder; the user replaces it with a real aerial later)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="Placeholder aerial of Park Ave and Minnehaha Parkway">
  <rect width="1200" height="630" fill="#dbeafe"/>
  <rect x="540" y="0" width="120" height="630" fill="#cbd5e1"/>
  <rect x="0" y="255" width="1200" height="120" fill="#cbd5e1"/>
  <text x="600" y="300" font-family="sans-serif" font-size="48" fill="#1e3a8a" text-anchor="middle" font-weight="bold">Park Ave &amp; Minnehaha Pkwy</text>
  <text x="600" y="360" font-family="sans-serif" font-size="28" fill="#475569" text-anchor="middle">PLACEHOLDER — replace with real aerial/map</text>
</svg>
```

- [ ] **Step 4: Verify `campaign.json` is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/campaign.json','utf8')); console.log('campaign.json OK')"`
Expected: prints `campaign.json OK` (no parse error)

- [ ] **Step 5: Commit**

```bash
git add package.json data/campaign.json images/intersection-aerial.svg
git commit -m "Scaffold project: package.json, campaign content, placeholder image"
```

---

## Task 2: `compose.js` — `shownRecipients()`

**Files:**
- Create: `test/compose.test.js`
- Create: `js/compose.js`

- [ ] **Step 1: Write the failing test** in `test/compose.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shownRecipients } from '../js/compose.js';

const campaign = JSON.parse(
  readFileSync(new URL('../data/campaign.json', import.meta.url), 'utf8')
);

test('shownRecipients returns only recipients with shown:true', () => {
  const result = shownRecipients(campaign);
  assert.deepEqual(result.map(r => r.id), ['ward8', 'ward11', 'moran', 'olsen']);
});

test('shownRecipients excludes hidden commissioners', () => {
  const ids = shownRecipients(campaign).map(r => r.id);
  assert.ok(!ids.includes('forney'));
  assert.ok(!ids.includes('frederick'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — cannot find/`shownRecipients` not exported from `js/compose.js`

- [ ] **Step 3: Create `js/compose.js` with the minimal implementation**

```js
// Pure campaign-email logic. No DOM. Imported by js/app.js (browser) and tests (Node).

export function shownRecipients(campaign) {
  return campaign.recipients.filter(r => r.shown);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add js/compose.js test/compose.test.js
git commit -m "Add compose.shownRecipients with tests"
```

---

## Task 3: `compose.js` — `buildMailtoUrl()`

**Files:**
- Modify: `test/compose.test.js`
- Modify: `js/compose.js`

- [ ] **Step 1: Add the failing test** — append to `test/compose.test.js`, and add `buildMailtoUrl` to the import line at the top so it reads `import { shownRecipients, buildMailtoUrl } from '../js/compose.js';`

```js
test('buildMailtoUrl encodes subject and body and addresses one recipient', () => {
  const url = buildMailtoUrl('a@b.com', 'Hi there', 'Line1\nLine2 & more');
  assert.equal(url, 'mailto:a@b.com?subject=Hi%20there&body=Line1%0ALine2%20%26%20more');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `buildMailtoUrl` is not a function / not exported

- [ ] **Step 3: Add the implementation** to `js/compose.js`

```js
export function buildMailtoUrl(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add js/compose.js test/compose.test.js
git commit -m "Add compose.buildMailtoUrl with tests"
```

---

## Task 4: `compose.js` — `selectedFragments()`

**Files:**
- Modify: `test/compose.test.js`
- Modify: `js/compose.js`

- [ ] **Step 1: Add the failing test** — append to `test/compose.test.js`, and extend the import to `import { shownRecipients, buildMailtoUrl, selectedFragments } from '../js/compose.js';`

```js
test('selectedFragments returns fragments in campaign order, filtered by id', () => {
  // pass ids out of order; result must follow campaign.talkingPoints order (schools before bike)
  const result = selectedFragments(campaign, ['bike', 'schools']);
  assert.equal(result.length, 2);
  assert.ok(result[0].startsWith('This intersection is a daily route'));
  assert.ok(result[1].startsWith('This is a primary connection'));
});

test('selectedFragments returns empty array when nothing selected', () => {
  assert.deepEqual(selectedFragments(campaign, []), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `selectedFragments` is not exported

- [ ] **Step 3: Add the implementation** to `js/compose.js`

```js
export function selectedFragments(campaign, selectedIds) {
  return campaign.talkingPoints
    .filter(p => selectedIds.includes(p.id))
    .map(p => p.fragment);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add js/compose.js test/compose.test.js
git commit -m "Add compose.selectedFragments with tests"
```

---

## Task 5: `compose.js` — `composeEmailBody()`

**Files:**
- Modify: `test/compose.test.js`
- Modify: `js/compose.js`

- [ ] **Step 1: Add the failing tests** — append to `test/compose.test.js`, and extend the import to `import { shownRecipients, buildMailtoUrl, selectedFragments, composeEmailBody } from '../js/compose.js';`

```js
function sampleArgs(overrides = {}) {
  return Object.assign({
    salutation: 'Dear Commissioner Olsen',
    opening: 'As someone who bikes through it, I am writing to ask you to make it safe.',
    fragments: ['First point.', 'Second point.'],
    note: '',
    ask: { summary: 'I am asking you to:', items: ['Do A.', 'Do B.'], closing: 'Thank you.' },
    name: '',
    address: ''
  }, overrides);
}

test('composeEmailBody assembles greeting, opening, fragments, ask, signature', () => {
  const body = composeEmailBody(sampleArgs());
  assert.equal(body,
    'Dear Commissioner Olsen,\n\n' +
    'As someone who bikes through it, I am writing to ask you to make it safe.\n\n' +
    'First point.\n\n' +
    'Second point.\n\n' +
    'I am asking you to:\n- Do A.\n- Do B.\n\n' +
    'Thank you.\n\n' +
    'Sincerely,\n[Your Name]\n[Your Address]'
  );
});

test('composeEmailBody includes a personal note as its own block when provided', () => {
  const body = composeEmailBody(sampleArgs({ note: '  My kid bikes here daily.  ' }));
  assert.ok(body.includes('\n\nMy kid bikes here daily.\n\n'));
});

test('composeEmailBody omits the note block when note is blank', () => {
  const body = composeEmailBody(sampleArgs({ note: '   ' }));
  // Second point flows straight into the ask summary with no empty block between
  assert.ok(body.includes('Second point.\n\nI am asking you to:'));
});

test('composeEmailBody uses real name and address when given', () => {
  const body = composeEmailBody(sampleArgs({ name: 'Jane Doe', address: '123 Park Ave' }));
  assert.ok(body.endsWith('Sincerely,\nJane Doe\n123 Park Ave'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `composeEmailBody` is not exported

- [ ] **Step 3: Add the implementation** to `js/compose.js`

```js
export function composeEmailBody({ salutation, opening, fragments, note, ask, name, address }) {
  const blocks = [];
  blocks.push(`${salutation},`);
  blocks.push(opening);
  for (const fragment of fragments) blocks.push(fragment);

  const trimmedNote = (note || '').trim();
  if (trimmedNote) blocks.push(trimmedNote);

  blocks.push(ask.summary + '\n' + ask.items.map(item => `- ${item}`).join('\n'));
  blocks.push(ask.closing);
  blocks.push(`Sincerely,\n${name || '[Your Name]'}\n${address || '[Your Address]'}`);

  return blocks.join('\n\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add js/compose.js test/compose.test.js
git commit -m "Add compose.composeEmailBody with tests"
```

---

## Task 6: `index.html` — page skeleton, Tailwind, static meta

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`** with the full shell. Containers are empty; `js/app.js` fills them. `__SITE_BASE__` in the meta tags is replaced during deploy (Task 12).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Park Ave &amp; Minnehaha Parkway — Make It Safe</title>
  <meta name="description" content="Email Minneapolis City Council and Park Board to fix a dangerous intersection for kids, people on bikes, walkers, and drivers.">

  <!-- Open Graph / Twitter (single static page — crawlers read these directly). -->
  <!-- __SITE_BASE__ is replaced with the deployed base URL during deploy (see plan Task 12). -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="__SITE_BASE__">
  <meta property="og:title" content="Park Ave &amp; Minnehaha Parkway — Make It Safe">
  <meta property="og:description" content="Email Minneapolis City Council and Park Board to fix a dangerous intersection for kids, people on bikes, walkers, and drivers.">
  <meta property="og:image" content="__SITE_BASE__images/intersection-aerial.svg">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="Park Ave &amp; Minnehaha Parkway — Make It Safe">
  <meta property="twitter:description" content="Email Minneapolis City Council and Park Board to fix a dangerous intersection for kids, people on bikes, walkers, and drivers.">
  <meta property="twitter:image" content="__SITE_BASE__images/intersection-aerial.svg">

  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 sm:p-8">
  <div class="max-w-3xl mx-auto space-y-6">

    <!-- Hero -->
    <header class="bg-white rounded-lg shadow-xl p-6 sm:p-8">
      <h1 id="hero-title" class="text-3xl sm:text-4xl font-bold text-gray-900"></h1>
      <p id="hero-subtitle" class="text-gray-600 mt-2"></p>
      <img id="hero-image" alt="Park Ave & Minnehaha Parkway" class="w-full rounded-lg mt-4 border border-gray-200">
    </header>

    <!-- The problem -->
    <section class="bg-white rounded-lg shadow p-6 sm:p-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">The problem</h2>
      <div id="problem-points" class="space-y-4"></div>
    </section>

    <!-- The ask -->
    <section class="bg-amber-50 border border-amber-200 rounded-lg p-6 sm:p-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-2">The ask</h2>
      <p id="ask-summary" class="text-gray-800"></p>
      <ul id="ask-items" class="list-disc list-inside text-gray-800 mt-2 space-y-1"></ul>
      <p id="ask-closing" class="text-gray-700 mt-3"></p>
    </section>

    <!-- Write the council + park board -->
    <section class="bg-white rounded-lg shadow p-6 sm:p-8 space-y-6">
      <h2 class="text-xl font-semibold text-gray-800">Write the Council &amp; Park Board</h2>

      <div>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">1. I am a…</h3>
        <div id="perspective-options" class="flex flex-wrap gap-2"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">2. Include these points</h3>
        <div id="point-options" class="space-y-2"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">3. Add a personal note (optional)</h3>
        <textarea id="note-input" rows="3" placeholder="A sentence in your own words makes the biggest difference."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"></textarea>
      </div>

      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input id="name-input" type="text" placeholder="Jane Doe"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Your address</label>
          <input id="address-input" type="text" placeholder="123 Example Ave, Minneapolis, MN 55417"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
        </div>
      </div>

      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p class="text-sm font-medium text-gray-700 mb-1">Subject</p>
        <p id="preview-subject" class="text-sm bg-white p-2 rounded border border-gray-300"></p>
        <p class="text-sm font-medium text-gray-700 mt-3 mb-1">Preview</p>
        <pre id="preview-body" class="text-sm bg-white p-3 rounded border border-gray-300 whitespace-pre-wrap font-sans"></pre>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">4. Send to each (individual emails)</h3>
        <div id="send-list" class="space-y-4"></div>
      </div>
    </section>

    <!-- Share -->
    <section id="share-section" class="bg-white rounded-lg shadow p-6 sm:p-8"></section>

    <!-- Footer -->
    <footer class="text-center text-xs text-gray-500 px-4 pb-8">
      <p><strong>Privacy:</strong> This tool runs entirely in your browser. Nothing you type — your note, name, or address — is collected, stored, or sent anywhere. It only leaves your device inside the email you choose to send.</p>
    </footer>

  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Serve and verify the shell renders** (no errors; containers empty for now)

Run: `python3 -m http.server 8080`
Then open `http://localhost:8080`.
Expected: page loads with the gradient background, section headings ("The problem", "The ask", "Write the Council & Park Board"), the placeholder image renders, and the browser console shows a 404/empty only because `js/app.js` does not exist yet (created next task). No HTML/CSS errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add index.html shell with static meta and empty containers"
```

---

## Task 7: `js/app.js` — load data and render hero / problem / ask

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Create `js/app.js`** with data loading + content rendering. (Widget, send list, and share are added in later tasks.)

```js
import { shownRecipients, selectedFragments, composeEmailBody, buildMailtoUrl } from './compose.js';

// ── Module state ───────────────────────────────────────────
let campaign = null;
let selectedPerspective = null;
const selectedPoints = new Set();

// ── Data loading ───────────────────────────────────────────
async function loadCampaign() {
  const resp = await fetch('data/campaign.json', { cache: 'no-store' });
  if (!resp.ok) throw new Error('Failed to load campaign.json');
  return resp.json();
}

// ── Content rendering ──────────────────────────────────────
function renderHero(c) {
  document.getElementById('hero-title').textContent = c.campaign.title;
  document.getElementById('hero-subtitle').textContent = c.campaign.subtitle;
  document.getElementById('hero-image').src = c.meta.ogImage;
}

function renderProblem(c) {
  const host = document.getElementById('problem-points');
  host.innerHTML = c.talkingPoints.map(p => `
    <div class="border-l-4 border-emerald-400 pl-4">
      <h3 class="font-semibold text-gray-900">${p.label}</h3>
      ${p.image ? `<img src="${p.image}" alt="" class="w-full rounded mt-2 border border-gray-200">` : ''}
      <p class="text-sm text-gray-700 mt-1">${p.fragment}</p>
    </div>
  `).join('');
}

function renderAsk(c) {
  document.getElementById('ask-summary').textContent = c.ask.summary;
  document.getElementById('ask-items').innerHTML =
    c.ask.items.map(item => `<li>${item}</li>`).join('');
  document.getElementById('ask-closing').textContent = c.ask.closing;
}

// ── Init ───────────────────────────────────────────────────
async function init() {
  campaign = await loadCampaign();
  renderHero(campaign);
  renderProblem(campaign);
  renderAsk(campaign);
}

init();
```

> **Per-angle photos (spec §5/§9):** a talking point renders a photo only if it has an optional `"image"` field. v1 JSON has none, so the problem section is text cards plus the hero aerial. To add a danger photo later, drop the file in `images/` and add `"image": "images/danger-….jpg"` to that talking point in `data/campaign.json` — no code change.

- [ ] **Step 2: Serve and verify content renders**

Run: `python3 -m http.server 8080` (if not already running) and open `http://localhost:8080`.
Expected: hero title/subtitle populate, the five problem points render with labels + text, and the ask section shows its summary, two bullet items, and closing line. Console is error-free.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "Render hero, problem, and ask sections from campaign.json"
```

---

## Task 8: `js/app.js` — compose widget + live preview

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add the widget functions** — paste these functions into `js/app.js` immediately above the `// ── Init ──` comment

```js
// ── Compose widget ─────────────────────────────────────────
function renderPerspectives(c) {
  selectedPerspective = c.defaultPerspective;
  const host = document.getElementById('perspective-options');
  host.innerHTML = c.perspectives.map(p => `
    <label class="px-3 py-2 border rounded-lg cursor-pointer text-sm">
      <input type="radio" name="perspective" value="${p.id}" class="mr-1"
        ${p.id === c.defaultPerspective ? 'checked' : ''}>
      ${p.label}
    </label>
  `).join('');
  host.addEventListener('change', e => {
    if (e.target.name === 'perspective') {
      selectedPerspective = e.target.value;
      updatePreview(c);
    }
  });
}

function renderPoints(c) {
  selectedPoints.clear();
  const host = document.getElementById('point-options');
  host.innerHTML = c.talkingPoints.map(p => {
    if (p.defaultSelected) selectedPoints.add(p.id);
    return `
      <label class="flex items-start gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer text-sm">
        <input type="checkbox" value="${p.id}" class="mt-1" ${p.defaultSelected ? 'checked' : ''}>
        <span class="text-gray-800">${p.label}</span>
      </label>`;
  }).join('');
  host.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;
    if (e.target.checked) selectedPoints.add(e.target.value);
    else selectedPoints.delete(e.target.value);
    updatePreview(c);
  });
}

function getSelections() {
  return {
    perspectiveId: selectedPerspective,
    selectedPointIds: [...selectedPoints],
    note: document.getElementById('note-input').value,
    name: document.getElementById('name-input').value,
    address: document.getElementById('address-input').value
  };
}

// Build the email body for one recipient using the current selections.
function bodyForRecipient(c, recipient) {
  const s = getSelections();
  const perspective = c.perspectives.find(p => p.id === s.perspectiveId);
  return composeEmailBody({
    salutation: recipient.salutation,
    opening: perspective.opening,
    fragments: selectedFragments(c, s.selectedPointIds),
    note: s.note,
    ask: c.ask,
    name: s.name,
    address: s.address
  });
}

function updatePreview(c) {
  document.getElementById('preview-subject').textContent = c.emailDefaults.subject;
  // Preview uses the first shown recipient's salutation as a representative example.
  const previewRecipient = shownRecipients(c)[0];
  document.getElementById('preview-body').textContent = bodyForRecipient(c, previewRecipient);
}

function wireWidget(c) {
  ['note-input', 'name-input', 'address-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => updatePreview(c));
  });
}
```

- [ ] **Step 2: Wire it into `init()`** — in `js/app.js`, inside `init()`, add these lines immediately after `renderAsk(campaign);`

```js
  renderPerspectives(campaign);
  renderPoints(campaign);
  wireWidget(campaign);
  updatePreview(campaign);
```

- [ ] **Step 3: Serve and verify the widget + preview**

Open `http://localhost:8080`. Expected:
- Five perspective radios show, "Parent" preselected.
- Five point checkboxes show, all checked.
- The preview body shows: "Dear Council Member Stevenson," (first shown recipient), the parent opening, all five fragments, the ask + two bullets + closing, then "Sincerely, [Your Name] / [Your Address]".
- Unchecking a point removes its paragraph; switching perspective changes the opening line; typing a note inserts it as its own paragraph; typing name/address replaces the placeholders — all live.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Add compose widget (perspective, points, note, name/address) with live preview"
```

---

## Task 9: `js/app.js` — per-recipient send checklist

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add the send-list functions** — paste these into `js/app.js` immediately above the `// ── Init ──` comment

```js
// ── Send checklist (one individual email per recipient) ────
function renderSendList(c) {
  const recipients = shownRecipients(c);
  const bodies = {};                       // group recipients by governing body
  recipients.forEach(r => { (bodies[r.body] ||= []).push(r); });

  const host = document.getElementById('send-list');
  host.innerHTML = Object.entries(bodies).map(([body, members]) => `
    <div>
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">${body}</p>
      <div class="space-y-2">
        ${members.map(r => `
          <div class="flex items-center gap-2" data-recipient="${r.id}">
            <a href="#" data-send="${r.id}"
               class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Email ${r.name} (${r.role})
            </a>
            <button type="button" data-copy="${r.id}"
               class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Copy</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Set/refresh each send link's mailto href whenever it (or anything) changes.
  refreshSendLinks(c);

  host.addEventListener('click', async e => {
    const sendEl = e.target.closest('[data-send]');
    const copyEl = e.target.closest('[data-copy]');
    if (sendEl) {
      markOpened(sendEl);                  // let the default mailto navigation proceed
      return;
    }
    if (copyEl) {
      e.preventDefault();
      const r = recipients.find(x => x.id === copyEl.dataset.copy);
      await navigator.clipboard.writeText(bodyForRecipient(c, r));
      const original = copyEl.textContent;
      copyEl.textContent = '✓ Copied';
      setTimeout(() => { copyEl.textContent = original; }, 2000);
    }
  });
}

// Recompute every send link's mailto: href from the current selections.
function refreshSendLinks(c) {
  const recipients = shownRecipients(c);
  document.querySelectorAll('[data-send]').forEach(el => {
    const r = recipients.find(x => x.id === el.dataset.send);
    el.href = buildMailtoUrl(r.email, c.emailDefaults.subject, bodyForRecipient(c, r));
  });
}

function markOpened(sendEl) {
  if (sendEl.dataset.opened) return;
  sendEl.dataset.opened = 'true';
  sendEl.textContent = '✓ ' + sendEl.textContent.trim();
  sendEl.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
  sendEl.classList.add('bg-emerald-800');
}
```

- [ ] **Step 2: Keep send links current** — in `js/app.js`, at the END of the `updatePreview(c)` function body, add this guarded call (the send list may not exist yet on the very first call, so guard it)

```js
  if (document.querySelector('[data-send]')) refreshSendLinks(c);
```

- [ ] **Step 3: Wire it into `init()`** — in `init()`, add this line immediately after `updatePreview(campaign);`

```js
  renderSendList(campaign);
```

- [ ] **Step 4: Serve and verify the send checklist**

Open `http://localhost:8080`. Expected:
- Two groups appear: "CITY COUNCIL" (Stevenson W8, Whiting W11) and "PARK BOARD" (Carvajal Moran D5, Olsen At-Large). Forney/Frederick do NOT appear.
- Hovering an "Email …" link shows a `mailto:` URL in the status bar addressed to that one official.
- Edit a point/note/name, then click "Copy" on a recipient: the clipboard holds that recipient's body with the correct "Dear …," salutation and your latest edits.
- Clicking an "Email …" link opens your mail client pre-filled, and the button flips to "✓ Email …" and darkens.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Add per-recipient send checklist with mailto, copy, and opened state"
```

---

## Task 10: `js/app.js` — share section

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add the share functions** — paste these into `js/app.js` immediately above the `// ── Init ──` comment

```js
// ── Share ──────────────────────────────────────────────────
function renderShare(c) {
  const url = window.location.href.split('#')[0];
  const text = c.meta.shareText;
  document.getElementById('share-section').innerHTML = `
    <p class="font-semibold text-gray-800 mb-3 text-sm">Share this with your neighbors:</p>
    <div class="flex items-center gap-2 mb-3">
      <input id="share-url" type="text" readonly value="${url}"
        class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm" onclick="this.select()">
      <button id="copy-url-btn" class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm">Copy URL</button>
    </div>
    <div class="flex flex-wrap gap-2">
      <a target="_blank" rel="noopener" class="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm"
         href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}">X / Twitter</a>
      <a target="_blank" rel="noopener" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
         href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
      <button id="share-instagram" class="px-3 py-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-lg text-sm">Copy for Instagram</button>
    </div>
  `;

  document.getElementById('copy-url-btn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(url);
    const btn = document.getElementById('copy-url-btn');
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = 'Copy URL'; }, 2000);
  });

  document.getElementById('share-instagram').addEventListener('click', async () => {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    alert('Link and message copied. Open Instagram, create a Story or post, and paste.');
  });
}
```

- [ ] **Step 2: Wire it into `init()`** — in `init()`, add this line immediately after `renderSendList(campaign);`

```js
  renderShare(campaign);
```

- [ ] **Step 3: Serve and verify sharing**

Open `http://localhost:8080`. Expected:
- Share section shows the page URL, a "Copy URL" button (flips to "✓ Copied"), and X / Facebook / "Copy for Instagram" buttons.
- X and Facebook links open share dialogs pre-filled with the campaign text + URL.
- "Copy for Instagram" copies the share text + URL and shows the instructions alert.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Add share section (copy URL, X, Facebook, Instagram)"
```

---

## Task 11: Documentation — `README.md` and `CLAUDE.md`

**Files:**
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Park Ave & Minnehaha Parkway — Make It Safe

A single-page site that helps Minneapolis neighbors email the four officials responsible for the
Park Avenue & Minnehaha Parkway intersection, asking for an interim safety fix this summer and a
funded permanent redesign.

**Recipients:** Council Members Soren Stevenson (Ward 8) and Jamison Whiting (Ward 11); Park Board
Commissioners Kay Carvajal Moran (District 5) and Tom Olsen (At-Large). Each gets an individual,
pre-addressed email. Two more at-large commissioners are in the data but hidden by default.

## Editing the content
All copy lives in `data/campaign.json` — talking points, perspective openings, the ask, recipients,
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
npm test           # node --test  — unit tests for js/compose.js, zero dependencies
```

## Images
`images/intersection-aerial.svg` is a placeholder. Drop in a real aerial/map (ideally a 1200×630 JPG
named `intersection-aerial.jpg`) and update the `meta.ogImage` path in `data/campaign.json`.

## Deploy
Static site on GitHub Pages — push to `main`. See `CLAUDE.md` for the one-time setup and the
`__SITE_BASE__` meta-tag replacement.

## Privacy
No analytics, no backend, no third-party calls. Everything stays in the browser; data leaves only in
the email the sender chooses to send.
```

- [ ] **Step 2: Create `CLAUDE.md`**

```markdown
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
4. For working social previews, replace the placeholder SVG with a real 1200×630 JPG.

## Out of scope (v1)
Usage counter/tracking, multi-issue routing, before/after diagram, PDF, any backend. The send action
is isolated, so adding a counter later is a contained change.
```

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "Add README and CLAUDE.md docs"
```

---

## Task 12: Final verification + deploy notes

**Files:** none (verification + optional deploy)

- [ ] **Step 1: Run the full unit-test suite**

Run: `node --test`
Expected: all 9 tests PASS, exit code 0.

- [ ] **Step 2: Full manual pass against the spec's test checklist** (spec §14)

Serve (`npm run serve`) and open `http://localhost:8080`. Confirm each:
- Each "Email <name>" link opens a mail client addressed to that one official with the correct salutation, subject, and body.
- The four default recipients each have a send button; Forney/Frederick are absent.
- A recipient's button flips to "✓ …" after clicking and stays until reload (persists nothing on reload).
- Per-recipient "Copy" copies that email's body with the correct salutation and current edits.
- Toggling each talking point adds/removes its paragraph; switching perspective changes the opening; the note appears/disappears as its own paragraph; name/address placeholders fill in.
- Share buttons open with the correct URL/text; "Copy URL" and "Copy for Instagram" work.
- Layout is usable on a narrow (mobile) and wide (desktop) viewport.

- [ ] **Step 3: (Optional, when ready to publish) Deploy to GitHub Pages**

```bash
# Pick a repo name, then:
gh repo create <repo-name> --public --source=. --remote=origin --push
# Replace the deploy base in the meta tags (macOS sed):
sed -i '' 's#__SITE_BASE__#https://pete2786.github.io/<repo-name>/#g' index.html
git commit -am "Set deploy base URL for GitHub Pages"
git push
# Then in GitHub: Settings -> Pages -> Source: Deploy from a branch -> main / root.
```
Expected: site live at `https://pete2786.github.io/<repo-name>/`. (The campaign emails work locally and on Pages regardless; the `__SITE_BASE__` replacement only affects absolute OG image/URL in social previews.)

- [ ] **Step 4: Confirm clean tree**

Run: `git status`
Expected: working tree clean, all work committed.
