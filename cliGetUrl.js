/* Copyright 2026 Tutorializer LLC */

// Build-time replacement for the monorepo URL resolver. The published CLI
// only ever needs this product's own public URLs, so the full internal
// domain/port registry never enters the npm bundle. Overrides:
// TUTORIALIZER_API_URL and TUTORIALIZER_APP_URL.
export default function getUrl({ service } = {}) {
  if (service === 'api') {
    return process.env.TUTORIALIZER_API_URL || 'https://api.tutorializer.com'
  }
  if (service === 'app') {
    return process.env.TUTORIALIZER_APP_URL || 'https://app.tutorializer.com'
  }
  return 'https://www.tutorializer.com'
}
