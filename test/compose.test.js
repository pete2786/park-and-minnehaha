import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shownRecipients, buildMailtoUrl } from '../js/compose.js';

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

test('buildMailtoUrl encodes subject and body and addresses one recipient', () => {
  const url = buildMailtoUrl('a@b.com', 'Hi there', 'Line1\nLine2 & more');
  assert.equal(url, 'mailto:a@b.com?subject=Hi%20there&body=Line1%0ALine2%20%26%20more');
});
