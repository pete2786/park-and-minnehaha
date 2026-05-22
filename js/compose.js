// Pure campaign-email logic. No DOM. Imported by js/app.js (browser) and tests (Node).

export function shownRecipients(campaign) {
  return campaign.recipients.filter(r => r.shown);
}

export function buildMailtoUrl(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function selectedFragments(campaign, selectedIds) {
  return campaign.talkingPoints
    .filter(p => selectedIds.includes(p.id))
    .map(p => p.fragment);
}
