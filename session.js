/* Copyright 2026 Tutorializer LLC */
const createSessionStore = require('@monorepool/agentfirst/sessionStore.js')

// Same directory (~/.tutorializer/) and key names the CLI has always used, so
// an existing browser-login session keeps working unchanged; the store adds
// apiKeySecret for `tutorializer login --with-key`.
module.exports = createSessionStore({ productDirName: 'tutorializer' })
