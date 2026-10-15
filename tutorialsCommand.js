/* Copyright 2026 Tutorializer LLC */
import { inspect } from 'node:util'

import { fail, printJson, withJson } from '@monorepool/agentfirst/output.js'
import getTutorial from '@tutorializer/client/getTutorial.js'
import getTutorials from '@tutorializer/client/getTutorials.js'
import commander from 'commander'

import ensureAuth from './ensureAuth.js'
import getConfig from './getConfig.js'

function tutorialsCommand() {
  const command = new commander.Command('tutorials')
  command.description('manage tutorials')

  // tutorializer tutorials list
  withJson(
    command
      .command('list')
      .description('list tutorials')
      .option('--projectId [projectId]', 'project id')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async options => {
    try {
      await ensureAuth()

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      const parameters = {
        limit: options.limit || 10,
      }
      if (projectId) {
        parameters.projectId = projectId
      }

      const tutorials = await getTutorials(parameters)

      if (options.json) {
        printJson(tutorials)
      } else if (tutorials.length === 0) {
        console.log('No tutorials found')
      } else {
        console.log(`Found ${tutorials.length} tutorial(s):`)
        tutorials.forEach((tutorial, index) => {
          const name = tutorial.name || tutorial._id
          const email = tutorial.email ? ` (${tutorial.email})` : ''
          console.log(`${index + 1}. ${name}${email} (${tutorial._id})`)
        })
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer tutorials get [tutorialId]
  withJson(
    command
      .command('get [tutorialId]')
      .description('get tutorials (raw JSON), or a single tutorial by id')
      .option('--projectId [projectId]', 'project id')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async (tutorialId, options) => {
    try {
      await ensureAuth()

      if (tutorialId) {
        const tutorial = await getTutorial(tutorialId)

        if (tutorial) {
          if (options.json) {
            printJson(tutorial)
          } else {
            console.log(inspect(tutorial, { colors: true, depth: null }))
          }
        } else if (options.json) {
          fail(new Error('Tutorial not found'), { json: true })
        } else {
          console.log('Tutorial not found')
        }
      } else {
        const config = getConfig()
        const projectId = options.projectId || config?.projectId
        const parameters = {
          limit: options.limit || 10,
        }
        if (projectId) {
          parameters.projectId = projectId
        }
        const tutorials = await getTutorials(parameters)
        if (options.json) {
          printJson(tutorials)
        } else {
          console.log(inspect(tutorials, { colors: true, depth: null }))
        }
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer tutorials read <tutorialId>
  withJson(
    command
      .command('read <tutorialId>')
      .description('read a tutorial formatted for the terminal'),
  ).action(async (tutorialId, options) => {
    try {
      await ensureAuth()

      const tutorial = await getTutorial(tutorialId)

      if (!tutorial) {
        if (options.json) {
          fail(new Error('Tutorial not found'), { json: true })
        } else {
          console.log('Tutorial not found')
        }

        return
      }

      if (options.json) {
        printJson(tutorial)

        return
      }

      const dim = text => `\x1b[2m${text}\x1b[0m`
      const bold = text => `\x1b[1m${text}\x1b[0m`
      const cyan = text => `\x1b[36m${text}\x1b[0m`

      console.log()
      const name = tutorial.name || tutorial._id
      console.log(bold(name))
      console.log(dim(tutorial._id))
      console.log()

      const fields = []
      if (tutorial.name) {
        fields.push(`${cyan('name')}  ${tutorial.name}`)
      }
      if (tutorial.email) {
        fields.push(`${cyan('email')}  ${tutorial.email}`)
      }
      if (tutorial.phone) {
        fields.push(`${cyan('phone')}  ${tutorial.phone}`)
      }
      if (tutorial.language) {
        fields.push(`${cyan('language')}  ${tutorial.language}`)
      }
      if (tutorial.color) {
        fields.push(`${cyan('color')}  ${tutorial.color}`)
      }
      if (tutorial.projectId) {
        fields.push(`${cyan('projectId')}  ${tutorial.projectId}`)
      }
      if (tutorial.organizationId) {
        fields.push(`${cyan('organizationId')}  ${tutorial.organizationId}`)
      }
      if (tutorial.creationTime) {
        fields.push(`${cyan('created')}  ${tutorial.creationTime}`)
      }
      if (tutorial.lastEditTime) {
        fields.push(`${cyan('edited')}   ${tutorial.lastEditTime}`)
      }

      if (fields.length > 0) {
        fields.forEach(line => console.log(line))
      }

      console.log()
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  return command
}

export default tutorialsCommand
