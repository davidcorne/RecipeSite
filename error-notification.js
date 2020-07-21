'use strict'
const Airbrake = require('@airbrake/node')

const configuration = require('./configuration')

const makeNotifier = function () {
  // Only make an airbrake notifier if we have actual configuration
  if (configuration.airbrakeProjectId && configuration.airbrakeProjectKey) {
    return new Airbrake.Notifier({
      environment: configuration.environment,
      projectId: configuration.airbrakeProjectId,
      projectKey: configuration.airbrakeProjectKey
    })
  }
  return null
}

module.exports.notifier = makeNotifier()
