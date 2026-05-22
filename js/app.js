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
