// Pure campaign-email logic. No DOM. Imported by js/app.js (browser) and tests (Node).

export function shownRecipients(campaign) {
  return campaign.recipients.filter(r => r.shown);
}
