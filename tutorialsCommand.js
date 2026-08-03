/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const rehydrateSession = require('./session/rehydrateSession.js')
const isLoggedInSession = require('./session/isLoggedInSession.js')
const login = require('./login.js')
const getConfig = require('./getConfig.js')
const getTutorials = require('@tutorializer/client/getTutorials.js').default
const getTutorial = require('@tutorializer/client/getTutorial.js').default

async function ensureLoggedIn() {
  await rehydrateSession()

  if (!isLoggedInSession()) {
    console.log('Please login first')
    await login()
    await rehydrateSession()
  }
}

function tutorialsCommand() {
  const command = new commander.Command('tutorials')
  command.description('manage tutorials')

  // tutorializer tutorials list
  command
    .command('list')
    .description('list tutorials')
    .option('--projectId [projectId]', 'project id')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async options => {
      try {
        await ensureLoggedIn()

        const config = getConfig()
        const projectId = options.projectId || config?.projectId

        const parameters = {
          limit: options.limit || 10,
        }
        if (projectId) parameters.projectId = projectId

        const tutorials = await getTutorials(parameters)

        if (tutorials.length === 0) {
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
        console.log('error', error)
      }
    })

  // tutorializer tutorials get [tutorialId]
  command
    .command('get [tutorialId]')
    .description('get tutorials (raw JSON), or a single tutorial by id')
    .option('--projectId [projectId]', 'project id')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async (tutorialId, options) => {
      try {
        await ensureLoggedIn()

        if (tutorialId) {
          const tutorial = await getTutorial(tutorialId)

          if (tutorial) {
            console.log(inspect(tutorial, { colors: true, depth: null }))
          } else {
            console.log('Tutorial not found')
          }
        } else {
          const config = getConfig()
          const projectId = options.projectId || config?.projectId
          const parameters = {
            limit: options.limit || 10,
          }
          if (projectId) parameters.projectId = projectId
          const tutorials = await getTutorials(parameters)
          console.log(inspect(tutorials, { colors: true, depth: null }))
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer tutorials read <tutorialId>
  command
    .command('read <tutorialId>')
    .description('read a tutorial formatted for the terminal')
    .action(async tutorialId => {
      try {
        await ensureLoggedIn()

        const tutorial = await getTutorial(tutorialId)

        if (!tutorial) {
          console.log('Tutorial not found')

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
        if (tutorial.name) fields.push(`${cyan('name')}  ${tutorial.name}`)
        if (tutorial.email) fields.push(`${cyan('email')}  ${tutorial.email}`)
        if (tutorial.phone) fields.push(`${cyan('phone')}  ${tutorial.phone}`)
        if (tutorial.language) fields.push(`${cyan('language')}  ${tutorial.language}`)
        if (tutorial.color) fields.push(`${cyan('color')}  ${tutorial.color}`)
        if (tutorial.projectId) fields.push(`${cyan('projectId')}  ${tutorial.projectId}`)
        if (tutorial.organizationId) fields.push(`${cyan('organizationId')}  ${tutorial.organizationId}`)
        if (tutorial.creationTime) fields.push(`${cyan('created')}  ${tutorial.creationTime}`)
        if (tutorial.lastEditTime) fields.push(`${cyan('edited')}   ${tutorial.lastEditTime}`)

        if (fields.length > 0) {
          fields.forEach(line => console.log(line))
        }

        console.log()
      } catch (error) {
        console.log('error', error)
      }
    })

  return command
}

module.exports = tutorialsCommand
