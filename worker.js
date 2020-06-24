'use strict'
const express = require('express')
const pug = require('pug')
const decode = require('urldecode')
const path = require('path')
const fs = require('fs')
const dictionary = require('dictionary-en-gb')
const nspell = require('nspell')

const utils = require('./utils')
const log = require('./log')
const conversion = require('./conversion')
const search = require('./search')
const fileList = require('./file-list')

let INDEX = []
const RECIPE_ROOT = 'public/recipes'

let SPELL = null

// Compile a function
const TEMPLATES = {
  'index': pug.compileFile('template/index.pug'),
  'search': pug.compileFile('template/search.pug'),
  'new': pug.compileFile('template/new.pug'),
  'new-not-ready': pug.compileFile('template/new-not-ready.pug'),
  'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
  'conversion': pug.compileFile('template/conversion.pug'),
  '404': pug.compileFile('template/404.pug')
}

const APP = express()
const HTTP = require('http').Server(APP)

APP.set('port', (process.env.PORT || 3000))

let DEBUG_VIEW = false
let GIT_COMMIT_SHA = ''

const loadSearchIndex = function () {
  search.buildIndex(RECIPE_ROOT, INDEX)
}

const MESSAGE_MAP = {
}

process.on('message', function (message) {
  log.debug('Recieved ' + JSON.stringify(message))
  if (message in MESSAGE_MAP) {
    MESSAGE_MAP[message]()
  } else if (message.git_commit_sha) {
    GIT_COMMIT_SHA = message.git_commit_sha
  } else {
    log.error('Unknown message "' + JSON.stringify(message) + '"')
  }
})

const onRequest = function (request) {
  log.debug(
    'Request: ' + request.path + ' ' + JSON.stringify(request.query)
  )
  DEBUG_VIEW = 'debug' in request.query
}

const sendTemplate = function (request, response, key, data) {
  data.debugView = DEBUG_VIEW
  data.git_commit_sha = GIT_COMMIT_SHA
  response.send(TEMPLATES[key](data))
}

APP.get('/', function (request, response) {
  onRequest(request)
  const locals = {
    recipes: fileList.generateFileList()
  }
  sendTemplate(request, response, 'index', locals)
})

APP.get('/new', function (request, response) {
  onRequest(request)
  if (Object.keys(INDEX).length === 0) {
    // Send a "new" results not ready signal.
    sendTemplate(request, response, 'new-not-ready', {})
  } else {
    const locals = {
      newRecipes: fileList.filterNewRecipes(INDEX)
    }
    sendTemplate(request, response, 'new', locals)
  }
})

APP.get('/conversion', function (request, response) {
  onRequest(request)
  // A list of the conversions that we cover.
  sendTemplate(
    request,
    response,
    'conversion',
    {conversions: conversion.conversions}
  )
})

APP.get('/public/*', function (request, response) {
  onRequest(request)
  const filePath = path.join(__dirname, decode(request.path))
  fs.stat(filePath, function (error, stats) {
    if (error) {
      handle404(request, response, 'Resource not found')
    } else {
      response.sendFile(filePath)
    }
  })
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

APP.get('/search', function (request, response) {
  onRequest(request)
  const data = {
    query: request.query.query,
    page: request.query.page ? request.query.page : 1
  }
  if (Object.keys(INDEX).length === 0) {
    // Send a search results not ready signal.
    sendTemplate(request, response, 'search-not-ready', data)
  } else {
    searchIndex(data)
    sendTemplate(request, response, data.key, data)
  }
})

const loadDictionary = function () {
  dictionary(function (error, dict) {
    if (error) {
      throw error
    }
    SPELL = nspell(dict)
    SPELL.add('halloumi')
  })
}

const start = function () {
  // Start building the search index
  loadSearchIndex()
  // Load the dictionary
  loadDictionary()
  HTTP.listen(APP.get('port'), function () {
    log.info('Listening on *:' + APP.get('port'))
  })
}

const handle404 = function (request, response, reason) {
  onRequest(request)
  response.status(404)
  sendTemplate(request, response, '404', {'reason': reason, 'path': request.path})
}

// Note: This should always be the last route, as otherwise it'll override the other routes.
APP.get('*', function (request, response) {
  handle404(request, response, 'Unknown Page')
})

module.exports.start = start
