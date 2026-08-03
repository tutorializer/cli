/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const inquirer = require('inquirer')
const rehydrateSession = require('./session/rehydrateSession.js')
const isLoggedInSession = require('./session/isLoggedInSession.js')
const login = require('./login.js')
const getConfig = require('./getConfig.js')
const getSpeeches = require('@tutorializer/client/getSpeeches.js').default
const getSpeech = require('@tutorializer/client/getSpeech.js').default
const updateSpeech = require('@tutorializer/client/updateSpeech.js').default
const deleteSpeech = require('@tutorializer/client/deleteSpeech.js').default

async function ensureLoggedIn() {
  await rehydrateSession()

  if (!isLoggedInSession()) {
    console.log('Please login first')
    await login()
    await rehydrateSession()
  }
}

function speechesCommand() {
  const command = new commander.Command('speeches')
  command.description('manage speeches')

  // tutorializer speeches list
  command
    .command('list')
    .description('list speeches')
    .option('--projectId [projectId]', 'project id')
    .option('--language [language]', 'filter by language')
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
        if (options.language) parameters.language = options.language

        const speeches = await getSpeeches(parameters)

        if (speeches.length === 0) {
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
        console.log('error', error)
      }
    })

  // tutorializer speeches get [speechId]
  command
    .command('get [speechId]')
    .description('get speeches (raw JSON), or a single speech by id')
    .option('--projectId [projectId]', 'project id')
    .option('--language [language]', 'filter by language')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async (speechId, options) => {
      try {
        await ensureLoggedIn()

        if (speechId) {
          const speech = await getSpeech(speechId)

          if (speech) {
            console.log(inspect(speech, { colors: true, depth: null }))
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
          console.log(inspect(speeches, { colors: true, depth: null }))
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer speeches read <speechId>
  command
    .command('read <speechId>')
    .description('read a speech formatted for the terminal')
    .action(async speechId => {
      try {
        await ensureLoggedIn()

        const speech = await getSpeech(speechId)

        if (!speech) {
          console.log('Speech not found')

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
        console.log('error', error)
      }
    })

  // tutorializer speeches set-pronunciation <speechId> <pronunciation>
  command
    .command('set-pronunciation <speechId> <pronunciation>')
    .description(
      'set the pronunciation hint and trigger a server-side ElevenLabs regeneration',
    )
    .action(async (speechId, pronunciation) => {
      try {
        await ensureLoggedIn()

        const speech = await getSpeech(speechId)

        if (!speech) {
          console.log('Speech not found')

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

        console.log(`Speech ${speechId} regenerated`)
        if (updated && updated.url) console.log(updated.url)
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer speeches delete <speechId>
  command
    .command('delete <speechId>')
    .description('delete a speech by id (also removes its S3 audio/alignment files)')
    .action(async speechId => {
      try {
        await ensureLoggedIn()

        await deleteSpeech(speechId)

        console.log(`Deleted speech ${speechId}`)
      } catch (error) {
        console.error('error', error)
        process.exit(1)
      }
    })

  // tutorializer speeches purge --contains <substring> [--projectId X] [--language en] [--dry-run] [--yes]
  command
    .command('purge')
    .description(
      'delete every speech whose text contains a substring (case-insensitive)',
    )
    .option('--contains <substring>', 'substring to match in speech text (required)')
    .option('--projectId [projectId]', 'project id (defaults to tutorializer.json)')
    .option('--language [language]', 'optional language filter')
    .option('--dry-run', 'list matches without deleting', false)
    .option('--yes', 'skip confirmation prompt', false)
    .action(async options => {
      try {
        await ensureLoggedIn()

        const substring = options.contains
        if (!substring) {
          console.error('error: --contains <substring> is required')
          process.exit(1)
        }

        const config = getConfig()
        const projectId = options.projectId || config?.projectId

        if (!projectId) {
          console.error(
            'error: missing projectId (pass --projectId or set it in tutorializer.json)',
          )
          process.exit(1)
        }

        const parameters = { projectId, limit: 100000 }
        if (options.language) parameters.language = options.language

        const speeches = await getSpeeches(parameters)

        const needle = substring.toLowerCase()
        const matches = speeches.filter(speech =>
          (speech.text || '').toLowerCase().includes(needle),
        )

        if (matches.length === 0) {
          console.log(`No speeches in project ${projectId} contain "${substring}"`)
          return
        }

        console.log(
          `Found ${matches.length} speech(es) in project ${projectId} containing "${substring}":`,
        )
        matches.forEach((speech, index) => {
          const text = (speech.text || '').replace(/\n/g, ' ').substring(0, 80)
          const lang = speech.language ? ` (${speech.language})` : ''
          console.log(`${index + 1}. ${speech._id}${lang} — ${text}`)
        })

        if (options.dryRun) {
          console.log('(dry-run — nothing deleted)')
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
            console.log('Aborted')
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
            process.stdout.write(`\rDeleted ${deleted}/${matches.length}...`)
          } catch (error) {
            failed += 1
            console.error(`\nFailed to delete ${speech._id}: ${error.message}`)
          }
        }
        process.stdout.write('\n')

        console.log(`Deleted ${deleted}/${matches.length} (failed: ${failed})`)
      } catch (error) {
        console.error('error', error)
        process.exit(1)
      }
    })

  return command
}

module.exports = speechesCommand
