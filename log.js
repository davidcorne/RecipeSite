'use strict'

const winston = require('winston')

// We want info to be the default logging level
winston.level = (process.env.LOG_LEVEL || 'info')

const log = function (level, string) {
}

const logFunction = function (level) {
  // Return a log function for that level
  return function (string, extra) {
    extra = extra || {}
    extra['process'] = process.pid
    winston.log(level, string, extra)
  }
}

const level = function () {
  return winston.level
}

module.exports.error = logFunction('error')
module.exports.warn = logFunction('warn')
module.exports.info = logFunction('info')
module.exports.debug = logFunction('debug')
module.exports.silly = logFunction('silly')
module.exports.level = level
