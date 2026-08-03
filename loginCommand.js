/* Copyright 2026 Tutorializer LLC */
const agentfirstLoginCommand = require('@monorepool/agentfirst/loginCommand.js')
const {
  setApiKeyForTutorializerClient,
} = require('@tutorializer/client/apiKey.js')
const get = require('@tutorializer/client/get.js').default
const getAppUrl = require('./getAppUrl.js')
const session = require('./session.js')

// One cheap authenticated GET so a bad key fails at login instead of at the
// first real command. The key is fed straight to the bundled client (which
// sends `Basic base64(secret)`), and the client's default failure printer is
// bypassed — its stack-trace dump is noise here, the status + message are
// what the user can act on.
async function verify() {
  setApiKeyForTutorializerClient(session.getApiKeySecret())

  const projects = await get({ url: 'projects' }, error => {
    const wrapped = new Error(
      error?.message || (typeof error === 'string' ? error : 'request failed'),
    )

    if (error?.status) {
      wrapped.status = error.status
    }

    throw wrapped
  })

  return `Logged in with an API key — ${projects.length} project(s) visible.`
}

module.exports = function loginCommand() {
  return agentfirstLoginCommand({
    binaryName: 'tutorializer',
    appUrl: getAppUrl(),
    session,
    envKeyName: 'TUTORIALIZER_API_KEY',
    verify,
  })
}
