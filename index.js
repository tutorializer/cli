#!/usr/bin/env node
/* Copyright 2026 Tutorializer LLC */
process.env.WAITERIO_ENV = 'production'
const program = require('commander')
const skillsCommand = require('@monorepool/agentfirst/skillsCommand.js')
const speechesCommand = require('./speechesCommand.js')
const projectsCommand = require('./projectsCommand.js')
const videosCommand = require('./videosCommand.js')
const tutorialsCommand = require('./tutorialsCommand.js')
const loginCommand = require('./loginCommand.js')
const logoutCommand = require('./logoutCommand.js')
const schemaCommand = require('./schemaCommand.js')
const packageJson = require('./package.json')

program
  .name('tutorializer')
  .description('tutorializer cli')
  .version(packageJson.version)
  .addCommand(speechesCommand())
  .addCommand(projectsCommand())
  .addCommand(videosCommand())
  .addCommand(tutorialsCommand())
  .addCommand(loginCommand())
  .addCommand(logoutCommand())
  // The shared factory needs this file's directory to find the bundled
  // skills both in dev (cli/skills after a build, ../skills/public/skills
  // before one) and from the published dist/index.js.
  .addCommand(skillsCommand({ baseDirectory: __dirname }))
  // Receives the composed program so `tutorializer schema` prints the
  // command tree exactly as it runs, itself included.
  .addCommand(schemaCommand({ program }))
  .parse(process.argv)
