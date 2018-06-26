'use strict'

const log = require('./log')
const buildCache = require('./build-cache')

log.info('Logging level: ' + log.level())
buildCache.buildCache('public/recipes')
