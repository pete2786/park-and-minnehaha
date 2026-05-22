import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shownRecipients, buildMailtoUrl, selectedFragments, composeEmailBody } from '../js/compose.js';

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
