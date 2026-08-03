/* Copyright 2026 Tutorializer LLC */
const { inspect } = require('node:util')
const commander = require('commander')
const rehydrateSession = require('./session/rehydrateSession.js')
const isLoggedInSession = require('./session/isLoggedInSession.js')
const login = require('./login.js')
const getConfig = require('./getConfig.js')
const getVideos = require('@tutorializer/client/getVideos.js').default
const getVideo = require('@tutorializer/client/getVideo.js').default
const deleteVideo = require('@tutorializer/client/deleteVideo.js').default

async function ensureLoggedIn() {
  await rehydrateSession()

  if (!isLoggedInSession()) {
    console.log('Please login first')
    await login()
    await rehydrateSession()
  }
}

function videosCommand() {
  const command = new commander.Command('videos')
  command.description('manage videos')

  // tutorializer videos list
  command
    .command('list')
    .description('list videos')
    .option('--projectId [projectId]', 'project id')
    .option('--tutorialId [tutorialId]', 'filter by tutorial id')
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
        if (options.tutorialId) parameters.tutorialId = options.tutorialId

        const videos = await getVideos(parameters)

        if (videos.length === 0) {
          console.log('No videos found')
        } else {
          console.log(`Found ${videos.length} video(s):`)
          videos.forEach((video, index) => {
            const status = video.status || 'unknown'
            const startTime = video.startTime
              ? new Date(video.startTime).toLocaleString()
              : ''
            const endTime = video.endTime
              ? new Date(video.endTime).toLocaleString()
              : ''
            const times = startTime ? ` ${startTime}${endTime ? ` - ${endTime}` : ''}` : ''
            console.log(`${index + 1}. ${status}${times} (${video._id})`)
          })
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer videos get [videoId]
  command
    .command('get [videoId]')
    .description('get videos (raw JSON), or a single video by id')
    .option('--projectId [projectId]', 'project id')
    .option('--tutorialId [tutorialId]', 'filter by tutorial id')
    .option('-n, --limit [limit]', 'limit number of results')
    .action(async (videoId, options) => {
      try {
        await ensureLoggedIn()

        if (videoId) {
          const video = await getVideo(videoId)

          if (video) {
            console.log(inspect(video, { colors: true, depth: null }))
          } else {
            console.log('Video not found')
          }
        } else {
          const config = getConfig()
          const projectId = options.projectId || config?.projectId
          const parameters = {
            limit: options.limit || 10,
          }
          if (projectId) parameters.projectId = projectId
          if (options.tutorialId) parameters.tutorialId = options.tutorialId
          const videos = await getVideos(parameters)
          console.log(inspect(videos, { colors: true, depth: null }))
        }
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer videos read <videoId>
  command
    .command('read <videoId>')
    .description('read a video formatted for the terminal')
    .action(async videoId => {
      try {
        await ensureLoggedIn()

        const video = await getVideo(videoId)

        if (!video) {
          console.log('Video not found')

          return
        }

        const dim = text => `\x1b[2m${text}\x1b[0m`
        const bold = text => `\x1b[1m${text}\x1b[0m`
        const cyan = text => `\x1b[36m${text}\x1b[0m`

        console.log()
        const title = video.status || video._id
        console.log(bold(title))
        console.log(dim(video._id))
        console.log()

        const fields = []
        if (video.status) fields.push(`${cyan('status')}  ${video.status}`)
        if (video.startTime) fields.push(`${cyan('startTime')}  ${new Date(video.startTime).toLocaleString()}`)
        if (video.endTime) fields.push(`${cyan('endTime')}  ${new Date(video.endTime).toLocaleString()}`)
        if (video.url) fields.push(`${cyan('url')}  ${video.url}`)
        if (video.tutorialId) fields.push(`${cyan('tutorialId')}  ${video.tutorialId}`)
        if (video.projectId) fields.push(`${cyan('projectId')}  ${video.projectId}`)
        if (video.creationTime) fields.push(`${cyan('created')}  ${video.creationTime}`)
        if (video.lastEditTime) fields.push(`${cyan('edited')}   ${video.lastEditTime}`)

        if (fields.length > 0) {
          fields.forEach(line => console.log(line))
        }

        console.log()
      } catch (error) {
        console.log('error', error)
      }
    })

  // tutorializer videos delete <videoId>
  command
    .command('delete <videoId>')
    .description('delete a video by id')
    .action(async videoId => {
      try {
        await ensureLoggedIn()

        await deleteVideo(videoId)
        console.log(`Deleted video ${videoId}`)
      } catch (error) {
        console.log('error', error)
      }
    })

  return command
}

module.exports = videosCommand
