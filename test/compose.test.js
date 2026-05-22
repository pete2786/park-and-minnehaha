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
