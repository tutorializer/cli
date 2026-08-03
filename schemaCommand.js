/* Copyright 2026 Tutorializer LLC */
const agentfirstSchemaCommand = require('@monorepool/agentfirst/schemaCommand.js')

// index.js passes the composed commander program (pre-parse) so `tutorializer
// schema` describes the CLI exactly as it runs, `schema` itself included.
module.exports = function schemaCommand({ program } = {}) {
  return agentfirstSchemaCommand({
    program,
    binaryName: 'tutorializer',
    description: 'tutorializer cli',
  })
}
