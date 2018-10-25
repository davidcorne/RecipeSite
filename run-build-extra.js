'use strict'

const log = require('./log')
const buildCache = require('./build-cache')
const editTags = require('./edit-tags')

log.info('Logging level: ' + log.level())
buildCache.buildCache('public/recipes')
editTags.initialiseAllTags()
