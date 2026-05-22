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

function joinAnd(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// Build the email opening from the selected role phrases. Reads naturally for any count.
export function composeOpening(roles, lead, tail) {
  if (!roles || roles.length === 0) return `${lead} ${tail}`;
  return `${lead} As ${joinAnd(roles)}, ${tail}`;
}

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
