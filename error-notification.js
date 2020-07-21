'use strict'
const Airbrake = require('@airbrake/node')

const configuration = require('./configuration')

const notifier = new Airbrake.Notifier({
  environment: configuration.environment,
  projectId: configuration.airbrakeProjectId,
  projectKey: configuration.airbrakeProjectKey
})

module.exports.notifier = notifier
