/* Copyright 2026 Tutorializer LLC */
const createEnsureAuth = require('@monorepool/agentfirst/ensureAuth.js')
const loginWithBrowser = require('@monorepool/agentfirst/loginWithBrowser.js')
const {
  setAccessTokenForTutorializerClient,
  setAccessTokenCallbackForTutorializerClient,
} = require('@tutorializer/client/accessToken.js')
const {
  setRefreshTokenForTutorializerClient,
  isRefreshTokenExpired,
} = require('@tutorializer/client/refreshToken.js')
const {
  setApiKeyForTutorializerClient,
} = require('@tutorializer/client/apiKey.js')
const getAppUrl = require('./getAppUrl.js')
const session = require('./session.js')

// Wires whatever credential this invocation has into the bundled
// @tutorializer/client. Precedence — stored session > stored API key >
// TUTORIALIZER_API_KEY environment variable — comes from agentfirst's
// resolveCredential; a stored session deliberately outranks the environment
// key (wapiworld's rule) so a globally-exported key cannot silently hijack an
// interactive login. The client itself prefers an API key over tokens, which
// is why the key is only ever set when no session exists.
//
// With no credential at all: an interactive terminal keeps today's behavior
// and opens the browser login; headless it throws immediately with the login
// instructions instead of blocking on a browser nobody can see.
const resolveAuth = createEnsureAuth({
  session,
  envKeyName: 'TUTORIALIZER_API_KEY',
  binaryName: 'tutorializer',
  appUrl: getAppUrl(),
})

function rehydrateClientSession() {
  setAccessTokenForTutorializerClient(session.getAccessToken())
  setRefreshTokenForTutorializerClient(session.getRefreshToken())
  setAccessTokenCallbackForTutorializerClient(session.setAccessToken)
}

function clearClientSession() {
  setAccessTokenCallbackForTutorializerClient(null)
  setAccessTokenForTutorializerClient(null)
  setRefreshTokenForTutorializerClient(null)
}

module.exports = async function ensureAuth() {
  let resolved = await resolveAuth()

  if (resolved.mode === 'token') {
    rehydrateClientSession()

    // A dead refresh token is terminal: no request can mint tokens again.
    // Drop only the session — a stored API key (or the environment key) is
    // still valid and becomes the credential on the second resolution.
    if (isRefreshTokenExpired()) {
      session.remove('accessToken')
      session.remove('refreshToken')
      clearClientSession()

      resolved = await resolveAuth()
    }
  }

  if (resolved.mode === 'key') {
    setApiKeyForTutorializerClient(resolved.credential)
  }

  if (!resolved.mode) {
    // Interactive terminal with no credentials: keep the historical
    // auto-login. resolveAuth already printed the alternatives (--with-key,
    // TUTORIALIZER_API_KEY) to stderr, and throws instead when headless.
    await loginWithBrowser({ appUrl: getAppUrl(), session })
    rehydrateClientSession()
  }
}
