#!/usr/bin/env node
/* Copyright 2026 Tutorializer LLC */
import { existsSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  process.env.WAITERIO_ENV = 'production'

  const { default: program } = await import('./program.js')

  program.parse(process.argv)
}
