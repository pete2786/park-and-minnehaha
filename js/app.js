import { shownRecipients, selectedFragments, composeEmailBody, buildMailtoUrl, composeOpening } from './compose.js';

// ── Module state ───────────────────────────────────────────
let campaign = null;
const selectedPerspectives = new Set();
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
  host.innerHTML =
    '<ul class="list-disc list-inside space-y-1 text-gray-800">' +
    c.talkingPoints.map(p => `<li>${p.label}</li>`).join('') +
    '</ul>';
}

function renderAsk(c) {
  document.getElementById('ask-summary').textContent = c.ask.summary;
  document.getElementById('ask-items').innerHTML =
    c.ask.items.map(item => `<li>${item}</li>`).join('');
  document.getElementById('ask-closing').textContent = c.ask.closing;
}

// ── Compose widget ─────────────────────────────────────────
function renderPerspectives(c) {
  selectedPerspectives.clear();
  c.defaultPerspectives.forEach(id => selectedPerspectives.add(id));
  const host = document.getElementById('perspective-options');
  host.innerHTML = c.perspectives.map(p => `
    <label class="px-3 py-2 border rounded-lg cursor-pointer text-sm">
      <input type="checkbox" name="perspective" value="${p.id}" class="mr-1"
        ${selectedPerspectives.has(p.id) ? 'checked' : ''}>
      ${p.label}
    </label>
  `).join('');
  host.addEventListener('change', e => {
    if (e.target.name !== 'perspective') return;
    if (e.target.checked) selectedPerspectives.add(e.target.value);
    else selectedPerspectives.delete(e.target.value);
    updatePreview(c);
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
    perspectiveIds: [...selectedPerspectives],
    selectedPointIds: [...selectedPoints],
    note: document.getElementById('note-input').value,
    name: document.getElementById('name-input').value,
    address: document.getElementById('address-input').value
  };
}

// Build the email body for one recipient using the current selections.
function bodyForRecipient(c, recipient) {
  const s = getSelections();
  const roles = c.perspectives
    .filter(p => s.perspectiveIds.includes(p.id))
    .map(p => p.role);
  return composeEmailBody({
    salutation: recipient.salutation,
    opening: composeOpening(roles, c.opening.lead, c.opening.tail),
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
  if (document.querySelector('[data-send]')) refreshSendLinks(c);
}

function wireWidget(c) {
  ['note-input', 'name-input', 'address-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => updatePreview(c));
  });
}

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

// ── Init ───────────────────────────────────────────────────
async function init() {
  campaign = await loadCampaign();
  renderHero(campaign);
  renderProblem(campaign);
  renderAsk(campaign);
  renderPerspectives(campaign);
  renderPoints(campaign);
  wireWidget(campaign);
  updatePreview(campaign);
  renderSendList(campaign);
  renderShare(campaign);
}

init();
