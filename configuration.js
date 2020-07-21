'use strict'

const fs = require('fs')
const os = require('os')

const configuration = {
  numberOfWorkers: (process.env.WORKERS || os.cpus().length),
  logLevel: (process.env.LOG_LEVEL || 'info'),
  herokuSlugCommit: process.env.HEROKU_SLUG_COMMIT,
  port: (process.env.PORT || 3000),
  environment: (process.env.ENVIRONMENT || 'debug'),
  airbrakeProjectId: process.env.AIRBRAKE_PROJECT_ID,
  airbrakeProjectKey: process.env.AIRBRAKE_API_KEY
}

// Override those properties with the user config, if it exists
if (fs.existsSync('./.user_config.json')) {
  const userConfig = require('./.user_config')
  for (const property in userConfig) {
    configuration[property] = userConfig[property]
  }
}

module.exports = configuration
