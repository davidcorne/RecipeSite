'use strict'

const os = require('os')

const configuration = {
  numberOfWorkers: (process.env.WORKERS || os.cpus().length),
  logLevel: (process.env.LOG_LEVEL || 'info'),
  herokuSlugCommit: process.env.HEROKU_SLUG_COMMIT,
  port: (process.env.PORT || 3000)
}

module.exports = configuration
