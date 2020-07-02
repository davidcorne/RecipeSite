'use strict'
const dictionary = require('dictionary-en-gb')
const express = require('express')
const nspell = require('nspell')

const log = require('./log')
const router = require('./router')
const search = require('./search')

const APP = express()
const HTTP = require('http').Server(APP)
const INDEX = []

APP.set('port', (process.env.PORT || 3000))

process.on('message', function (message) {
  log.debug('Recieved ' + JSON.stringify(message))
  if (message.git_commit_sha) {
    // X GIT_COMMIT_SHA = message.git_commit_sha
  } else {
    log.error('Unknown message "' + JSON.stringify(message) + '"')
  }
})

const loadDictionary = function (router) {
  dictionary(function (error, dict) {
    if (error) {
      throw error
    }
    router.spell = nspell(dict)
    router.spell.add('halloumi')
  })
}

const setupRoutes = function (router) {
  APP.get('/', router.root.bind(router))
  APP.get('/new', router.newRecipes.bind(router))
  APP.get('/conversion', router.conversion.bind(router))
  APP.get('/public/*', router.public.bind(router))
  APP.get('/search', router.search.bind(router))
  // Note: This should always be the last route, as otherwise it'll override the other routes.
  APP.get('*', router.pageNotFound.bind(router))
}

const start = function () {
  // Start building the search index
  const recipeRoot = 'public/recipes'
  search.buildIndex(recipeRoot, INDEX)

  const router_ = new router.Router(APP, INDEX)
  setupRoutes(router_)
  // Load the dictionary
  loadDictionary(router_)
  HTTP.listen(APP.get('port'), function () {
    log.info('Listening on *:' + APP.get('port'))
  })
}

// Allow you to run the worker as a single process if you don't need the cluster.
if (require.main === module) {
  start()
}

module.exports.start = start
