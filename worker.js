'use strict'
const express = require('express')
const decode = require('urldecode')
const path = require('path')
const fs = require('fs')
const dictionary = require('dictionary-en-gb')
const nspell = require('nspell')

const utils = require('./utils')
const log = require('./log')
const conversion = require('./conversion')
const search = require('./search')
const router = require('./router')

let INDEX = []

let SPELL = null

const APP = express()
const HTTP = require('http').Server(APP)

APP.set('port', (process.env.PORT || 3000))

process.on('message', function (message) {
  log.debug('Recieved ' + JSON.stringify(message))
  if (message.git_commit_sha) {
    //X GIT_COMMIT_SHA = message.git_commit_sha
  } else {
    log.error('Unknown message "' + JSON.stringify(message) + '"')
  }
})

const searchIndex = function (data) {
  // We've got a search index, actually search it.
  const timer = utils.timer().start()
  const results = search.search(data.query, INDEX)
  timer.stop()
  data['key'] = 'search'
  // See if it's well spelled, as long as we've loaded a spellchecker
  let suggestions = []
  if (SPELL) {
    suggestions = SPELL.suggest(data.query)
  }
  data['suggestions'] = suggestions
  data['results_length'] = results.length
  data['time'] = timer.milliseconds
  // slice the search data by the page
  const bottom = (data.page - 1) * 20
  const top = Math.min(data.page * 20, results.length)
  data['results'] = results.slice(bottom, top)
  // For display add 1, as they're not array indices.
  data['bottom'] = bottom + 1
  data['top'] = top
}

const loadDictionary = function () {
  dictionary(function (error, dict) {
    if (error) {
      throw error
    }
    SPELL = nspell(dict)
    SPELL.add('halloumi')
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
  // Load the dictionary
  loadDictionary()
  // Setup routes
  const router_ = new router.Router(APP)
  setupRoutes(router_)
  HTTP.listen(APP.get('port'), function () {
    log.info('Listening on *:' + APP.get('port'))
  })
}

// Allow you to run the worker as a single process if you don't need the cluster.
if (require.main === module) {
  start()
}

module.exports.start = start
