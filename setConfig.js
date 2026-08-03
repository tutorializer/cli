/* Copyright 2026 Tutorializer LLC */
const fs = require('fs-extra')
const path = require('node:path')

module.exports = function setConfig(config) {
  const configPath = path.resolve('.', 'tutorializer.json')

  let string = ''

  if (config) {
    string = JSON.stringify(config)
  }

  config = fs.writeFileSync(configPath, string)

  return config
}
