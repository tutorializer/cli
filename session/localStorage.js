/* Copyright 2026 Tutorializer LLC */
const os = require('node:os')
const path = require('node:path')
const { LocalStorage } = require('node-localstorage')

let localStorage

if (!localStorage) {
  const homeDir = os.homedir()
  localStorage = new LocalStorage(path.resolve(homeDir, '.tutorializer'))
}

module.exports = localStorage
