'use strict'
const cluster = require('cluster')
const fs = require('fs')
const log = require('./log')
const os = require('os')

const NUMBER_OF_WORKERS = (process.env.WORKERS || os.cpus().length)
let GIT_COMMIT_SHA

const startWorkers = function () {
  let currentWorkers = Object.keys(cluster.workers).length
  // currentWorkers should always be 0, but it's worth checking.
  const workersToSetup = NUMBER_OF_WORKERS - currentWorkers
  log.info('Master cluster setting up ' + workersToSetup + ' workers')
  for (let i = 0; i < workersToSetup; i++) {
    cluster.fork()
  }
}

const setupCallbacks = function () {
  cluster.on('online', function (worker) {
    log.info('Worker ' + worker.process.pid + ' is online.')
  })
  cluster.on('exit', function (worker, code, signal) {
    // You only get one of code and signal, only display one.
    log.info(
      'Worker ' +
                worker.process.pid +
                ' died (' +
                (code || signal) +
                ')'
    )
    log.info('Starting a new worker.')
    cluster.fork()
  })
  // Add a hook to the online event, whenever we get a new worker we want it
  // to read the search index.
  cluster.on('online', function (worker) {
    worker.process.send('load-search-index')
    worker.send({git_commit_sha: GIT_COMMIT_SHA})
  })
}

const getGitCommitShaSync = function () {
  if (process.env.HEROKU_SLUG_COMMIT) {
    // We're in the Heroku environment, just get it from the meta-data
    return process.env.HEROKU_SLUG_COMMIT
  } else {
    // We're not in Heroku, read the git file ourselves
    const rev = fs.readFileSync('.git/HEAD').toString()
    if (rev.indexOf(':') === -1) {
      return rev
    } else {
      const branch = rev.substring(5).trim()
      return fs.readFileSync('.git/' + branch).toString().trim()
    }
  }
}

const start = function () {
  log.info('Logging level: ' + log.level())
  GIT_COMMIT_SHA = getGitCommitShaSync()
  setupCallbacks()
  startWorkers()
}

module.exports.start = start
