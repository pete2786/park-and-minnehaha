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
}

init();
