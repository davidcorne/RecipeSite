'use strict'
const cluster = require('cluster')
const child_process = require('child_process')
const fs = require('fs')
const log = require('./log')

const configuration = require('./configuration')

let GIT_COMMIT_SHA

const startWorkers = function () {
  const currentWorkers = Object.keys(cluster.workers).length
  // currentWorkers should always be 0, but it's worth checking.
  const workersToSetup = configuration.numberOfWorkers - currentWorkers
  log.info('Master cluster setting up ' + workersToSetup + ' workers')
  for (let i = 0; i < workersToSetup; i++) {
    cluster.fork()
  }
}

const update = function () {
  child_process.exec('git pull', function (error, stdout, stderr) {
    log.error(stderr)
    log.info(stdout)
    if (error) {
      // If something goes wrong updating git it should be fatal.
      log.error()
      throw error
    }
    // Now kill all of the workers, and new ones will be made with the new code.
    stopWorkers()
  })
}

const stopWorkers = function () {
  for (const id in cluster.workers) {
    cluster.workers[id].kill()
  }
}

const setupExitCallback = function () {
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
}

const setupCallbacks = function () {
  cluster.on('online', function (worker) {
    log.info('Worker ' + worker.process.pid + ' is online.')
    worker.send({ git_commit_sha: GIT_COMMIT_SHA })
  })
  setupExitCallback()
}

const getGitCommitShaSync = function () {
  if (configuration.herokuSlugCommit) {
    // We're in the Heroku environment, just get it from the meta-data
    return configuration.herokuSlugCommit
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
  log.info(JSON.stringify(configuration, null, 4))
  GIT_COMMIT_SHA = getGitCommitShaSync()
  setupCallbacks()
  startWorkers()
}

module.exports.start = start
