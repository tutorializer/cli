/* Copyright 2026 Tutorializer LLC */
const {
  setAccessTokenForTutorializerClient,
  setAccessTokenCallbackForTutorializerClient,
} = require('@tutorializer/client/accessToken.js')
const {
  setRefreshTokenForTutorializerClient,
} = require('@tutorializer/client/refreshToken.js')
const setAccessToken = require('./setAccessToken.js')
const setRefreshToken = require('./setRefreshToken.js')

module.exports = async function storeNewSession({ accessToken, refreshToken }) {
  try {
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)

    setAccessTokenForTutorializerClient(accessToken, setAccessToken)
    setRefreshTokenForTutorializerClient(refreshToken, setRefreshToken)
    setAccessTokenCallbackForTutorializerClient(setAccessToken)

    return true
  } catch (error) {
    console.error('error', error)
    throw error
  }
}
