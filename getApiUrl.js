/* Copyright 2026 Tutorializer LLC */

// The CLI always talks to the public API origin — same contract as
// getAppUrl.js and cliGetUrl.js (the build-time replacement for the monorepo
// URL resolver): the internal domain/port registry never enters the npm
// bundle. TUTORIALIZER_API_URL overrides for non-production deployments.
//
// Deliberately dependency-free rather than a re-export of cliGetUrl.js: that
// module is only reached through the esbuild alias, while `node index.js` and
// the skills drift test import these factories unbundled.
export default function getApiUrl() {
  return process.env.TUTORIALIZER_API_URL || 'https://api.tutorializer.com'
}
