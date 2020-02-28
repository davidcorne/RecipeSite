'use strict'

const log = require('./log')
const buildCache = require('./build-cache')
const editMetadata = require('./edit-metadata')

log.info('Logging level: ' + log.level())
buildCache.buildCache('public/recipes')
editMetadata.initialiseAllMetadata()
