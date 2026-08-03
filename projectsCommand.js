/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const { printJson, withJson, fail } = require('@monorepool/agentfirst/output.js')
const ensureAuth = require('./ensureAuth.js')
const getConfig = require('./getConfig.js')
const getProjects = require('@tutorializer/client/getProjects.js').default
const getProject = require('@tutorializer/client/getProject.js').default
const addProject = require('@tutorializer/client/addProject.js').default

function projectsCommand() {
  const command = new commander.Command('projects')
  command.description('manage projects')

  // tutorializer projects list
  withJson(
    command
      .command('list')
      .description('list projects')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async options => {
    try {
      await ensureAuth()

      const parameters = {}

      let projects = await getProjects(parameters)

      if (options.limit) {
        projects = projects.slice(0, parseInt(options.limit, 10))
      } else {
        projects = projects.slice(0, 10)
      }

      if (options.json) {
        printJson(projects)
      } else if (projects.length === 0) {
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
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects get [projectId]
  withJson(
    command
      .command('get [projectId]')
      .description('get projects (raw JSON), or a single project by id')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async (projectId, options) => {
    try {
      await ensureAuth()

      if (projectId) {
        const project = await getProject(projectId)

        if (project) {
          if (options.json) {
            printJson(project)
          } else {
            console.log(inspect(project, { colors: true, depth: null }))
          }
        } else if (options.json) {
          fail(new Error('Project not found'), { json: true })
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
        if (options.json) {
          printJson(projects)
        } else {
          console.log(inspect(projects, { colors: true, depth: null }))
        }
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects read <projectId>
  withJson(
    command
      .command('read <projectId>')
      .description('read a project formatted for the terminal'),
  ).action(async (projectId, options) => {
    try {
      await ensureAuth()

      const project = await getProject(projectId)

      if (!project) {
        if (options.json) {
          fail(new Error('Project not found'), { json: true })
        } else {
          console.log('Project not found')
        }

        return
      }

      if (options.json) {
        printJson(project)

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
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects create <name> [--domain example.com]
  withJson(
    command
      .command('create <name>')
      .description('create a new project')
      .option('--domain <domain>', 'optional domain (e.g. example.com)'),
  ).action(async (name, options) => {
    try {
      await ensureAuth()

      const body = { name }
      if (options.domain) body.domain = options.domain

      const project = await addProject(body)

      if (options.json) {
        printJson({
          ok: true,
          id: project._id,
          name: project.name,
          domain: project.domain,
        })
      } else {
        console.log(`Created project: ${project.name} (${project._id})`)
        if (project.domain) console.log(`Domain: ${project.domain}`)
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects pronunciation ...
  const pronunciation = new commander.Command('pronunciation')
  pronunciation.description('manage project pronunciation rules')

  // tutorializer projects pronunciation list [--projectId <id>]
  withJson(
    pronunciation
      .command('list')
      .description('list pronunciation rules for a project')
      .option('--projectId [projectId]', 'project id'),
  ).action(async options => {
    try {
      await ensureAuth()

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      if (!projectId) {
        throw new Error(
          'missing projectId (pass --projectId or set it in tutorializer.json)',
        )
      }

      const project = await getProject(projectId)

      if (!project) {
        throw new Error(`project ${projectId} not found`)
      }

      const rules = project.pronunciationRules || []

      if (options.json) {
        printJson(rules)
        return
      }

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
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects pronunciation add <word> <phonemes> [--projectId <id>] [--alphabet ipa|cmu]
  withJson(
    pronunciation
      .command('add <word> <phonemes>')
      .description('add or replace a pronunciation rule')
      .option('--projectId [projectId]', 'project id')
      .option('--alphabet [alphabet]', 'phonetic alphabet (ipa|cmu)', 'ipa'),
  ).action(async (word, phonemes, options) => {
    try {
      await ensureAuth()

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      if (!projectId) {
        throw new Error(
          'missing projectId (pass --projectId or set it in tutorializer.json)',
        )
      }

      const alphabet = options.alphabet || 'ipa'

      if (alphabet !== 'ipa' && alphabet !== 'cmu') {
        throw new Error(
          `invalid --alphabet "${alphabet}" (expected "ipa" or "cmu")`,
        )
      }

      const project = await getProject(projectId)

      if (!project) {
        throw new Error(`project ${projectId} not found`)
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

      if (options.json) {
        printJson({
          ok: true,
          word,
          phonemes,
          alphabet,
          replaced,
          pronunciationDictionaryVersionId:
            saved?.pronunciationDictionaryVersionId,
        })
        return
      }

      console.log(
        `${replaced ? 'Replaced' : 'Added'} rule: ${word} -> ${phonemes} (${alphabet})`,
      )

      if (saved?.pronunciationDictionaryVersionId) {
        console.log(
          `Dictionary version: ${saved.pronunciationDictionaryVersionId}`,
        )
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer projects pronunciation remove <word> [--projectId <id>]
  withJson(
    pronunciation
      .command('remove <word>')
      .description('remove a pronunciation rule by word')
      .option('--projectId [projectId]', 'project id'),
  ).action(async (word, options) => {
    try {
      await ensureAuth()

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      if (!projectId) {
        throw new Error(
          'missing projectId (pass --projectId or set it in tutorializer.json)',
        )
      }

      const project = await getProject(projectId)

      if (!project) {
        throw new Error(`project ${projectId} not found`)
      }

      const existingRules = project.pronunciationRules || []
      const nextRules = existingRules.filter(rule => rule.word !== word)

      if (nextRules.length === existingRules.length) {
        throw new Error(`no such rule for word "${word}"`)
      }

      const saved = await addProject({
        ...project,
        pronunciationRules: nextRules,
      })

      if (options.json) {
        printJson({
          ok: true,
          word,
          pronunciationDictionaryVersionId:
            saved?.pronunciationDictionaryVersionId,
        })
        return
      }

      console.log(`Removed rule: ${word}`)

      if (saved?.pronunciationDictionaryVersionId) {
        console.log(
          `Dictionary version: ${saved.pronunciationDictionaryVersionId}`,
        )
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  command.addCommand(pronunciation)

  return command
}

module.exports = projectsCommand
