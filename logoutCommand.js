/* Copyright 2026 Tutorializer LLC */
import agentfirstLogoutCommand from '@monorepool/agentfirst/logoutCommand.js'

import session from './session.js'

export default function logoutCommand() {
  return agentfirstLogoutCommand({
    binaryName: 'tutorializer',
    session,
    envKeyName: 'TUTORIALIZER_API_KEY',
  })
}
