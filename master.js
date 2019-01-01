'use strict'
const cluster = require('cluster')
const log = require('./log')
const os = require('os')

const numWorkers = (process.env.WORKERS || os.cpus().length)

const startWorkers = function () {
  let currentWorkers = Object.keys(cluster.workers).length
  // currentWorkers should always be 0, but it's worth checking.
  const workersToSetup = numWorkers - currentWorkers
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
    worker.process.send('read-commit-tag')
    worker.process.send('load-search-index')
  })
}

const start = function () {
  log.info('Logging level: ' + log.level())
  setupCallbacks()
  startWorkers()
}

module.exports.start = start
