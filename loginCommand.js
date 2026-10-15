/* Copyright 2026 Tutorializer LLC */
import agentfirstLoginCommand from '@monorepool/agentfirst/loginCommand.js'
import { setApiKeyForTutorializerClient } from '@tutorializer/client/apiKey.js'
import get from '@tutorializer/client/get.js'

import getApiUrl from './getApiUrl.js'
import getAppUrl from './getAppUrl.js'
import packageJson from './package.json' with { type: 'json' }
import session from './session.js'

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

// `--browser` opens app.tutorializer.com/cli and prints a one-time code
// beside it, so the login can also be finished from another device;
// `--device` approves that code from a phone or another computer, with no
// browser on this machine.
export default function loginCommand() {
  return agentfirstLoginCommand({
    binaryName: 'tutorializer',
    appUrl: getAppUrl(),
    getApiUrl,
    version: packageJson.version,
    session,
    envKeyName: 'TUTORIALIZER_API_KEY',
    verify,
  })
}
