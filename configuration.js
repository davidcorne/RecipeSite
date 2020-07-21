'use strict'

const fs = require('fs')
const os = require('os')

const configuration = {
  numberOfWorkers: (process.env.WORKERS || os.cpus().length),
  logLevel: (process.env.LOG_LEVEL || 'info'),
  herokuSlugCommit: process.env.HEROKU_SLUG_COMMIT,
  port: (process.env.PORT || 3000)
}

// Override those properties with the user config
fs.stat('./user_config.json', function (error) {
  if (!error) {
    const userConfig = require('./user_config')
    for (const property in userConfig) {
      configuration[property] = userConfig[property]
    }
  }
})

module.exports = configuration
