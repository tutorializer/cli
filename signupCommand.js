/* Copyright 2026 Tutorializer LLC */
import agentfirstSignupCommand from '@monorepool/agentfirst/signupCommand.js'

import getApiUrl from './getApiUrl.js'
import getAppUrl from './getAppUrl.js'
import session from './session.js'

// The step that used to need a person. `login` assumes the account already
// exists; an agent pointed at tutorializer.com for the first time has none to
// log into, and the browser flow it fell into blocked on a window nobody was
// there to complete.
//
//   tutorializer signup --email founder@example.com --json
//
// stores the session in the same ~/.tutorializer/ the browser flow writes, so
// every other command works immediately afterwards.
export default function signupCommand() {
  return agentfirstSignupCommand({
    binaryName: 'tutorializer',
    getApiUrl,
    appUrl: getAppUrl(),
    session,
  })
}
