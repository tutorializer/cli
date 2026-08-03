/* Copyright 2026 Tutorializer LLC */
const agentfirstLogoutCommand = require('@monorepool/agentfirst/logoutCommand.js')
const session = require('./session.js')

module.exports = function logoutCommand() {
  return agentfirstLogoutCommand({
    binaryName: 'tutorializer',
    session,
    envKeyName: 'TUTORIALIZER_API_KEY',
  })
}
