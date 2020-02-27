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

let index = []
const recipeRoot = 'public/recipes'

let spell = null

// Compile a function
const templates = {
  'index': pug.compileFile('template/index.pug'),
  'search': pug.compileFile('template/search.pug'),
  'new': pug.compileFile('template/new.pug'),
  'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
  'partial-load': pug.compileFile('template/partial-search.pug'),
  'conversion': pug.compileFile('template/conversion.pug')
}

const app = express()
const http = require('http').Server(app)

app.set('port', (process.env.PORT || 3000))

let partialLoad = false
let debugView = false
let gitCommitSha = ''

const loadSearchIndex = function () {
  partialLoad = false
  search.buildIndex(recipeRoot, index)
}

const partialLoadSearchIndex = function () {
  partialLoad = true
  search.buildIndex(recipeRoot, index)
}

const messageMap = {
  'load-search-index': loadSearchIndex,
  'partial-load-search-index': partialLoadSearchIndex
}

process.on('message', function (message) {
  log.debug('Recieved ' + JSON.stringify(message))
  if (message in messageMap) {
    messageMap[message]()
  } else if (message.git_commit_sha) {
    gitCommitSha = message.git_commit_sha
  } else {
    log.error('Unknown message "' + JSON.stringify(message) + '"')
  }
})

const onRequest = function (request) {
  log.debug(
    'Request: ' + request.path + ' ' + JSON.stringify(request.query)
  )
  debugView = 'debug' in request.query
}

const sendTemplate = function (request, response, key, data) {
  data.debugView = debugView
  data.git_commit_sha = gitCommitSha
  response.send(templates[key](data))
}

app.get('/', function (request, response) {
  onRequest(request)
  const locals = {
    recipes: fileList.generateFileList()
  }
  sendTemplate(request, response, 'index', locals)
})

const getNewRecipes = function () {
  const orderedRecipes = []
  for (let i = 0; i < 30; ++i) {
    const item = index[i]
    orderedRecipes.push({
      'path': item.file,
      'label': utils.pathToLabel(item.file),
      'displayPath': utils.pathToDisplayPath(item.file),
      'context': item.content.split('\n').slice(0, 10),
      'tags': item.tags
    })
  }
  return orderedRecipes
}

app.get('/new', function (request, response) {
  onRequest(request)
  const locals = {
    newRecipes: getNewRecipes()
  }
  sendTemplate(request, response, 'new', locals)
})

app.get('/conversion', function (request, response) {
  onRequest(request)
  // A list of the conversions that we cover.
  sendTemplate(
    request,
    response,
    'conversion',
    {conversions: conversion.conversions}
  )
})

app.get('/public/*', function (request, response) {
  onRequest(request)
  const filePath = path.join(__dirname, decode(request.path))
  fs.stat(filePath, function (error, stats) {
    if (error) {
      response.status(404).send('Resource not found')
    } else {
      response.sendFile(filePath)
    }
  })
})

const searchIndex = function (data) {
  // We've got a search index, actually search it.
  const timer = utils.timer().start()
  const results = search.search(data.query, index)
  timer.stop()
  data['key'] = partialLoad ? 'partial-load' : 'search'
  // See if it's well spelled, as long as we've loaded a spellchecker
  let suggestions = []
  if (spell) {
    suggestions = spell.suggest(data.query)
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

app.get('/search', function (request, response) {
  onRequest(request)
  const data = {
    query: request.query.query,
    page: request.query.page ? request.query.page : 1
  }
  if (Object.keys(index).length === 0) {
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
    spell = nspell(dict)
    spell.add('halloumi')
  })
}

const start = function () {
  // Load the dictionary
  loadDictionary()
  http.listen(app.get('port'), function () {
    log.info('Listening on *:' + app.get('port'))
  })
}

module.exports.start = start
