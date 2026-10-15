/* Copyright 2026 Tutorializer LLC */

import { fileURLToPath } from 'node:url'

import skillsCommand from '@monorepool/agentfirst/skillsCommand.js'
import program from 'commander'

import loginCommand from './loginCommand.js'
import logoutCommand from './logoutCommand.js'
import packageJson from './package.json' with { type: 'json' }
import projectsCommand from './projectsCommand.js'
import schemaCommand from './schemaCommand.js'
import signupCommand from './signupCommand.js'
import speechesCommand from './speechesCommand.js'
import tutorialsCommand from './tutorialsCommand.js'
import videosCommand from './videosCommand.js'

program
  .name('tutorializer')
  .description('tutorializer cli')
  .version(packageJson.version)
  .addCommand(speechesCommand())
  .addCommand(projectsCommand())
  .addCommand(videosCommand())
  .addCommand(tutorialsCommand())
  // `signup` before `login`: an agent with no account can create one and land
  // in the same ~/.tutorializer/ session the browser flow writes.
  .addCommand(signupCommand())
  .addCommand(loginCommand())
  .addCommand(logoutCommand())
  // The shared factory needs this file's directory to find the bundled
  // skills both in dev (cli/skills after a build, ../skills/public/skills
  // before one) and from the published dist/index.js.
  .addCommand(
    skillsCommand({
      baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
    }),
  )
  // Receives the composed program so `tutorializer schema` prints the
  // command tree exactly as it runs, itself included.
  .addCommand(schemaCommand({ program }))

export default program
