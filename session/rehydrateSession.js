/* Copyright 2026 Tutorializer LLC */
const {
  setAccessTokenForTutorializerClient,
  setAccessTokenCallbackForTutorializerClient,
} = require('@tutorializer/client/accessToken.js')
const {
  setRefreshTokenForTutorializerClient,
} = require('@tutorializer/client/refreshToken.js')
const getAccessToken = require('./getAccessToken.js')
const getRefreshToken = require('./getRefreshToken.js')
const setAccessToken = require('./setAccessToken.js')

module.exports = async function rehydrateSession() {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()

  setAccessTokenForTutorializerClient(accessToken)
  setRefreshTokenForTutorializerClient(refreshToken)
  setAccessTokenCallbackForTutorializerClient(setAccessToken)
}
