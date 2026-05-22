import { shownRecipients, selectedFragments, composeEmailBody, buildMailtoUrl, composeOpening } from './compose.js';

// ── Module state ───────────────────────────────────────────
let campaign = null;
const selectedPerspectives = new Set();
const selectedPoints = new Set();
let selectedRecipientId = null;
const openedRecipients = new Set();

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
  const r = selectedRecipient(c) || shownRecipients(c)[0];
  document.getElementById('preview-body').textContent = bodyForRecipient(c, r);
  if (document.getElementById('send-row')) updateSendRow(c);
}

function wireWidget(c) {
  ['note-input', 'name-input', 'address-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => updatePreview(c));
  });
}

// ── Recipient picker (above the email) + send row ──────────
function selectedRecipient(c) {
  return shownRecipients(c).find(r => r.id === selectedRecipientId);
}

function renderRecipientSelect(c) {
  const recipients = shownRecipients(c);
  if (!selectedRecipientId) selectedRecipientId = recipients[0].id;

  const groups = {};                       // group recipients by governing body
  recipients.forEach(r => { (groups[r.body] ||= []).push(r); });

  const host = document.getElementById('recipient-select');
  host.innerHTML = Object.entries(groups).map(([body, members]) => `
    <div class="mb-2">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">${body}</p>
      <div class="flex flex-wrap gap-2">
        ${members.map(r => `<button type="button" data-pick="${r.id}"></button>`).join('')}
      </div>
    </div>
  `).join('');

  host.addEventListener('click', e => {
    const btn = e.target.closest('[data-pick]');
    if (!btn) return;
    selectedRecipientId = btn.dataset.pick;
    updateRecipientChips(c);
    updatePreview(c);
  });

  updateRecipientChips(c);
}

// Refresh each chip's label (with ✓ once opened) and selected-state styling.
function updateRecipientChips(c) {
  const recipients = shownRecipients(c);
  document.querySelectorAll('[data-pick]').forEach(btn => {
    const r = recipients.find(x => x.id === btn.dataset.pick);
    const isSelected = r.id === selectedRecipientId;
    btn.className = 'px-3 py-1.5 rounded-lg border text-sm transition-colors ' +
      (isSelected ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700');
    btn.textContent = `${openedRecipients.has(r.id) ? '✓ ' : ''}${r.name} (${r.role})`;
  });
}

// Render the send + copy actions for the currently selected recipient.
function updateSendRow(c) {
  const r = selectedRecipient(c) || shownRecipients(c)[0];
  const body = bodyForRecipient(c, r);
  const host = document.getElementById('send-row');
  host.innerHTML = `
    <a href="${buildMailtoUrl(r.email, c.emailDefaults.subject, body)}" data-send
       class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium text-center">
       Open email to ${r.name} &rarr;
    </a>
    <button type="button" id="copy-btn"
       class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Copy email</button>
  `;
  host.querySelector('[data-send]').addEventListener('click', () => {
    openedRecipients.add(r.id);
    updateRecipientChips(c);
  });
  host.querySelector('#copy-btn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(body);
    openedRecipients.add(r.id);
    updateRecipientChips(c);
    const btn = host.querySelector('#copy-btn');
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = 'Copy email'; }, 2000);
  });
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
  renderRecipientSelect(campaign);
  updatePreview(campaign);
  renderShare(campaign);
}

init();
