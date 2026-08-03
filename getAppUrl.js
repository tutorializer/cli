/* Copyright 2026 Tutorializer LLC */

// The CLI always talks to the public app origin — same contract as
// cliGetUrl.js (the build-time replacement for the monorepo URL resolver):
// the internal domain/port registry never enters the npm bundle.
// TUTORIALIZER_APP_URL overrides for non-production deployments.
module.exports = function getAppUrl() {
  return process.env.TUTORIALIZER_APP_URL || 'https://app.tutorializer.com'
}
