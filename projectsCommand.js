/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const rehydrateSession = require('./session/rehydrateSession.js')
const isLoggedInSession = require('./session/isLoggedInSession.js')
const login = require('./login.js')
const getConfig = require('./getConfig.js')
const getProjects = require('@tutorializer/client/getProjects.js').default
const getProject = require('@tutorializer/client/getProject.js').default
const addProject = require('@tutorializer/client/addProject.js').default

async function ensureLoggedIn() {
  await rehydrateSession()

  if (!isLoggedInSession()) {
    console.log('Please login first')
    await login()
    await rehydrateSession()
  }
}

function projectsCommand() {
  const command = new commander.Command('projects')
  command.description('manage projects')

  // tutorializer projects list
  command
    .command('list')
    .description('list projects')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async options => {
      try {
        await ensureLoggedIn()

        const parameters = {}

        let projects = await getProjects(parameters)

        if (options.limit) {
          projects = projects.slice(0, parseInt(options.limit, 10))
        } else {
          projects = projects.slice(0, 10)
        }

        if (projects.length === 0) {
          console.log('No projects found')
        } else {
          console.log(`Found ${projects.length} project(s):`)
          projects.forEach((project, index) => {
            const name = project.name || project._id
            const domain = project.domain ? ` (${project.domain})` : ''
            console.log(`${index + 1}. ${name}${domain} (${project._id})`)
          })
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer projects get [projectId]
  command
    .command('get [projectId]')
    .description('get projects (raw JSON), or a single project by id')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async (projectId, options) => {
      try {
        await ensureLoggedIn()

        if (projectId) {
          const project = await getProject(projectId)

          if (project) {
            console.log(inspect(project, { colors: true, depth: null }))
          } else {
            console.log('Project not found')
          }
        } else {
          const parameters = {}
          let projects = await getProjects(parameters)
          if (options.limit) {
            projects = projects.slice(0, parseInt(options.limit, 10))
          } else {
            projects = projects.slice(0, 10)
          }
          console.log(inspect(projects, { colors: true, depth: null }))
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer projects read <projectId>
  command
    .command('read <projectId>')
    .description('read a project formatted for the terminal')
    .action(async projectId => {
      try {
        await ensureLoggedIn()

        const project = await getProject(projectId)

        if (!project) {
          console.log('Project not found')

          return
        }

        const dim = text => `\x1b[2m${text}\x1b[0m`
        const bold = text => `\x1b[1m${text}\x1b[0m`
        const cyan = text => `\x1b[36m${text}\x1b[0m`

        console.log()
        const name = project.name || project._id
        console.log(bold(name))
        const meta = [project._id]
        if (project.domain) meta.push(project.domain)
        console.log(dim(meta.join('  ·  ')))
        console.log()

        const fields = []
        if (project.name) fields.push(`${cyan('name')}  ${project.name}`)
        if (project.domain) fields.push(`${cyan('domain')}  ${project.domain}`)
        if (project.organizationId) fields.push(`${cyan('organizationId')}  ${project.organizationId}`)
        if (project.creationTime) fields.push(`${cyan('created')}  ${project.creationTime}`)
        if (project.lastEditTime) fields.push(`${cyan('edited')}   ${project.lastEditTime}`)

        if (fields.length > 0) {
          fields.forEach(line => console.log(line))
        }

        console.log()
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer projects create <name> [--domain example.com]
  command
    .command('create <name>')
    .description('create a new project')
    .option('--domain <domain>', 'optional domain (e.g. example.com)')
    .action(async (name, options) => {
      try {
        await ensureLoggedIn()

        const body = { name }
        if (options.domain) body.domain = options.domain

        const project = await addProject(body)

        console.log(`Created project: ${project.name} (${project._id})`)
        if (project.domain) console.log(`Domain: ${project.domain}`)
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer projects pronunciation ...
  const pronunciation = new commander.Command('pronunciation')
  pronunciation.description('manage project pronunciation rules')

  // tutorializer projects pronunciation list [--projectId <id>]
  pronunciation
    .command('list')
    .description('list pronunciation rules for a project')
    .option('--projectId [projectId]', 'project id')
    .action(async options => {
      try {
        await ensureLoggedIn()

        const config = getConfig()
        const projectId = options.projectId || config?.projectId

        if (!projectId) {
          console.error(
            'error: missing projectId (pass --projectId or set it in tutorializer.json)',
          )
          process.exit(1)
        }

        const project = await getProject(projectId)

        if (!project) {
          console.error(`error: project ${projectId} not found`)
          process.exit(1)
        }

        const rules = project.pronunciationRules || []

        if (rules.length === 0) {
          console.log('(no rules)')
          return
        }

        const headers = ['Word', 'IPA', 'Alphabet']
        const rows = rules.map(rule => [
          rule.word || '',
          rule.phonemes || '',
          rule.alphabet || 'ipa',
        ])
        const widths = headers.map((header, columnIndex) =>
          Math.max(
            header.length,
            ...rows.map(row => String(row[columnIndex]).length),
          ),
        )

        const formatRow = row =>
          row
            .map((cell, columnIndex) => String(cell).padEnd(widths[columnIndex]))
            .join('  ')

        console.log(formatRow(headers))
        console.log(widths.map(width => '-'.repeat(width)).join('  '))
        rows.forEach(row => console.log(formatRow(row)))
      } catch (error) {
        console.error('error', error)
        process.exit(1)
      }
    })

  // tutorializer projects pronunciation add <word> <phonemes> [--projectId <id>] [--alphabet ipa|cmu]
  pronunciation
    .command('add <word> <phonemes>')
    .description('add or replace a pronunciation rule')
    .option('--projectId [projectId]', 'project id')
    .option('--alphabet [alphabet]', 'phonetic alphabet (ipa|cmu)', 'ipa')
    .action(async (word, phonemes, options) => {
      try {
        await ensureLoggedIn()

        const config = getConfig()
        const projectId = options.projectId || config?.projectId

        if (!projectId) {
          console.error(
            'error: missing projectId (pass --projectId or set it in tutorializer.json)',
          )
          process.exit(1)
        }

        const alphabet = options.alphabet || 'ipa'

        if (alphabet !== 'ipa' && alphabet !== 'cmu') {
          console.error(
            `error: invalid --alphabet "${alphabet}" (expected "ipa" or "cmu")`,
          )
          process.exit(1)
        }

        const project = await getProject(projectId)

        if (!project) {
          console.error(`error: project ${projectId} not found`)
          process.exit(1)
        }

        const existingRules = project.pronunciationRules || []
        const newRule = { word, phonemes, alphabet }
        const nextRules = existingRules.filter(rule => rule.word !== word)
        nextRules.push(newRule)

        const saved = await addProject({
          ...project,
          pronunciationRules: nextRules,
        })

        const replaced = existingRules.some(rule => rule.word === word)
        console.log(
          `${replaced ? 'Replaced' : 'Added'} rule: ${word} -> ${phonemes} (${alphabet})`,
        )

        if (saved?.pronunciationDictionaryVersionId) {
          console.log(
            `Dictionary version: ${saved.pronunciationDictionaryVersionId}`,
          )
        }
      } catch (error) {
        console.error('error', error)
        process.exit(1)
      }
    })

  // tutorializer projects pronunciation remove <word> [--projectId <id>]
  pronunciation
    .command('remove <word>')
    .description('remove a pronunciation rule by word')
    .option('--projectId [projectId]', 'project id')
    .action(async (word, options) => {
      try {
        await ensureLoggedIn()

        const config = getConfig()
        const projectId = options.projectId || config?.projectId

        if (!projectId) {
          console.error(
            'error: missing projectId (pass --projectId or set it in tutorializer.json)',
          )
          process.exit(1)
        }

        const project = await getProject(projectId)

        if (!project) {
          console.error(`error: project ${projectId} not found`)
          process.exit(1)
        }

        const existingRules = project.pronunciationRules || []
        const nextRules = existingRules.filter(rule => rule.word !== word)

        if (nextRules.length === existingRules.length) {
          console.error(`error: no such rule for word "${word}"`)
          process.exit(1)
        }

        const saved = await addProject({
          ...project,
          pronunciationRules: nextRules,
        })

        console.log(`Removed rule: ${word}`)

        if (saved?.pronunciationDictionaryVersionId) {
          console.log(
            `Dictionary version: ${saved.pronunciationDictionaryVersionId}`,
          )
        }
      } catch (error) {
        console.error('error', error)
        process.exit(1)
      }
    })

  command.addCommand(pronunciation)

  return command
}

module.exports = projectsCommand
