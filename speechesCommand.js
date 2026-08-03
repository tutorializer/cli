/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const inquirer = require('inquirer')
const { printJson, withJson, fail } = require('@monorepool/agentfirst/output.js')
const ensureAuth = require('./ensureAuth.js')
const getConfig = require('./getConfig.js')
const getSpeeches = require('@tutorializer/client/getSpeeches.js').default
const getSpeech = require('@tutorializer/client/getSpeech.js').default
const updateSpeech = require('@tutorializer/client/updateSpeech.js').default
const deleteSpeech = require('@tutorializer/client/deleteSpeech.js').default

function speechesCommand() {
  const command = new commander.Command('speeches')
  command.description('manage speeches')

  // tutorializer speeches list
  withJson(
    command
      .command('list')
      .description('list speeches')
      .option('--projectId [projectId]', 'project id')
      .option('--language [language]', 'filter by language')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async options => {
    try {
      await ensureAuth()

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      const parameters = {
        limit: options.limit || 10,
      }
      if (projectId) parameters.projectId = projectId
      if (options.language) parameters.language = options.language

      const speeches = await getSpeeches(parameters)

      if (options.json) {
        printJson(speeches)
      } else if (speeches.length === 0) {
        console.log('No speeches found')
      } else {
        console.log(`Found ${speeches.length} speech(es):`)
        speeches.forEach((speech, index) => {
          const text = speech.text
            ? speech.text.replace(/\n/g, ' ').substring(0, 60)
            : ''
          const preview = text
            ? ` - ${text}${speech.text && speech.text.length > 60 ? '...' : ''}`
            : ''
          const lang = speech.language ? ` (${speech.language})` : ''
          console.log(`${index + 1}. ${speech._id}${lang}${preview}`)
        })
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer speeches get [speechId]
  withJson(
    command
      .command('get [speechId]')
      .description('get speeches (raw JSON), or a single speech by id')
      .option('--projectId [projectId]', 'project id')
      .option('--language [language]', 'filter by language')
      .option('-n, --limit [limit]', 'limit number of results'),
  ).action(async (speechId, options) => {
    try {
      await ensureAuth()

      if (speechId) {
        const speech = await getSpeech(speechId)

        if (speech) {
          if (options.json) {
            printJson(speech)
          } else {
            console.log(inspect(speech, { colors: true, depth: null }))
          }
        } else if (options.json) {
          fail(new Error('Speech not found'), { json: true })
        } else {
          console.log('Speech not found')
        }
      } else {
        const config = getConfig()
        const projectId = options.projectId || config?.projectId
        const parameters = {
          limit: options.limit || 10,
        }
        if (projectId) parameters.projectId = projectId
        if (options.language) parameters.language = options.language
        const speeches = await getSpeeches(parameters)
        if (options.json) {
          printJson(speeches)
        } else {
          console.log(inspect(speeches, { colors: true, depth: null }))
        }
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer speeches read <speechId>
  withJson(
    command
      .command('read <speechId>')
      .description('read a speech formatted for the terminal'),
  ).action(async (speechId, options) => {
    try {
      await ensureAuth()

      const speech = await getSpeech(speechId)

      if (!speech) {
        if (options.json) {
          fail(new Error('Speech not found'), { json: true })
        } else {
          console.log('Speech not found')
        }

        return
      }

      if (options.json) {
        printJson(speech)

        return
      }

      const dim = text => `\x1b[2m${text}\x1b[0m`
      const bold = text => `\x1b[1m${text}\x1b[0m`
      const cyan = text => `\x1b[36m${text}\x1b[0m`

      console.log()
      console.log(bold(speech._id))
      const meta = [speech._id]
      if (speech.language) meta.push(speech.language)
      console.log(dim(meta.join('  ·  ')))
      console.log()

      const fields = []
      if (speech.text) fields.push(`${cyan('text')}  ${speech.text}`)
      if (speech.language) fields.push(`${cyan('language')}  ${speech.language}`)
      if (speech.translatedText) fields.push(`${cyan('translatedText')}  ${speech.translatedText}`)
      if (speech.url) fields.push(`${cyan('url')}  ${speech.url}`)
      if (speech.duration) fields.push(`${cyan('duration')}  ${speech.duration}`)
      if (speech.projectId) fields.push(`${cyan('projectId')}  ${speech.projectId}`)
      if (speech.tutorialId) fields.push(`${cyan('tutorialId')}  ${speech.tutorialId}`)
      if (speech.creationTime) fields.push(`${cyan('created')}  ${speech.creationTime}`)
      if (speech.lastEditTime) fields.push(`${cyan('edited')}   ${speech.lastEditTime}`)

      if (fields.length > 0) {
        fields.forEach(line => console.log(line))
      }

      console.log()
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer speeches set-pronunciation <speechId> <pronunciation>
  withJson(
    command
      .command('set-pronunciation <speechId> <pronunciation>')
      .description(
        'set the pronunciation hint and trigger a server-side ElevenLabs regeneration',
      ),
  ).action(async (speechId, pronunciation, options) => {
    try {
      await ensureAuth()

      const speech = await getSpeech(speechId)

      if (!speech) {
        if (options.json) {
          fail(new Error('Speech not found'), { json: true })
        } else {
          console.log('Speech not found')
        }

        return
      }

      const updated = await updateSpeech({
        _id: speech._id,
        projectId: speech.projectId,
        organizationId: speech.organizationId,
        text: speech.text,
        language: speech.language,
        voice: speech.voice,
        translatedText: speech.translatedText,
        stability: speech.stability,
        similarityBoost: speech.similarityBoost,
        style: speech.style,
        useSpeakerBoost: speech.useSpeakerBoost,
        speed: speech.speed,
        pronunciation,
      })

      if (options.json) {
        printJson({ ok: true, id: speechId, url: updated?.url })
      } else {
        console.log(`Speech ${speechId} regenerated`)
        if (updated && updated.url) console.log(updated.url)
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer speeches delete <speechId>
  withJson(
    command
      .command('delete <speechId>')
      .description('delete a speech by id (also removes its S3 audio/alignment files)'),
  ).action(async (speechId, options) => {
    try {
      await ensureAuth()

      await deleteSpeech(speechId)

      if (options.json) {
        printJson({ ok: true, id: speechId })
      } else {
        console.log(`Deleted speech ${speechId}`)
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  // tutorializer speeches purge --contains <substring> [--projectId X] [--language en] [--dry-run] [--yes]
  withJson(
    command
      .command('purge')
      .description(
        'delete every speech whose text contains a substring (case-insensitive)',
      )
      .option('--contains <substring>', 'substring to match in speech text (required)')
      .option('--projectId [projectId]', 'project id (defaults to tutorializer.json)')
      .option('--language [language]', 'optional language filter')
      .option('--dry-run', 'list matches without deleting', false)
      .option('--yes', 'skip confirmation prompt', false),
  ).action(async options => {
    try {
      await ensureAuth()

      const substring = options.contains
      if (!substring) {
        throw new Error('--contains <substring> is required')
      }

      const config = getConfig()
      const projectId = options.projectId || config?.projectId

      if (!projectId) {
        throw new Error(
          'missing projectId (pass --projectId or set it in tutorializer.json)',
        )
      }

      const parameters = { projectId, limit: 100000 }
      if (options.language) parameters.language = options.language

      const speeches = await getSpeeches(parameters)

      const needle = substring.toLowerCase()
      const matches = speeches.filter(speech =>
        (speech.text || '').toLowerCase().includes(needle),
      )

      if (matches.length === 0) {
        if (options.json) {
          printJson({ ok: true, matched: 0, deleted: 0, failed: 0 })
        } else {
          console.log(`No speeches in project ${projectId} contain "${substring}"`)
        }
        return
      }

      if (!options.json) {
        console.log(
          `Found ${matches.length} speech(es) in project ${projectId} containing "${substring}":`,
        )
        matches.forEach((speech, index) => {
          const text = (speech.text || '').replace(/\n/g, ' ').substring(0, 80)
          const lang = speech.language ? ` (${speech.language})` : ''
          console.log(`${index + 1}. ${speech._id}${lang} — ${text}`)
        })
      }

      if (options.dryRun) {
        if (options.json) {
          printJson({
            ok: true,
            dryRun: true,
            matched: matches.length,
            ids: matches.map(speech => speech._id),
          })
        } else {
          console.log('(dry-run — nothing deleted)')
        }
        return
      }

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete ${matches.length} speech(es)?`,
            default: false,
          },
        ])

        if (!confirm) {
          if (options.json) {
            printJson({ ok: false, aborted: true, matched: matches.length })
          } else {
            console.log('Aborted')
          }
          return
        }
      }

      let deleted = 0
      let failed = 0
      for (const speech of matches) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await deleteSpeech(speech._id)
          deleted += 1
          if (!options.json) {
            process.stdout.write(`\rDeleted ${deleted}/${matches.length}...`)
          }
        } catch (error) {
          failed += 1
          console.error(`\nFailed to delete ${speech._id}: ${error.message}`)
        }
      }

      if (options.json) {
        printJson({ ok: failed === 0, matched: matches.length, deleted, failed })
      } else {
        process.stdout.write('\n')
        console.log(`Deleted ${deleted}/${matches.length} (failed: ${failed})`)
      }
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  return command
}

module.exports = speechesCommand
