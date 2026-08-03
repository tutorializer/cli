#!/usr/bin/env node
/* Copyright 2026 Tutorializer LLC */
process.env.WAITERIO_ENV = 'production'
const program = require('commander')
const speechesCommand = require('./speechesCommand.js')
const projectsCommand = require('./projectsCommand.js')
const videosCommand = require('./videosCommand.js')
const tutorialsCommand = require('./tutorialsCommand.js')
const loginCommand = require('./loginCommand.js')
const logoutCommand = require('./logoutCommand.js')
const skillsCommand = require('./skillsCommand.js')
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
  .addCommand(skillsCommand())
  .parse(process.argv)
