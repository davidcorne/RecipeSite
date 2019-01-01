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
let hash = null

// Compile a function
const templates = {
  'index': pug.compileFile('template/index.pug'),
  'search': pug.compileFile('template/search.pug'),
  'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
  'partial-load': pug.compileFile('template/partial-search.pug'),
  'conversion': pug.compileFile('template/conversion.pug')
}

const app = express()
const http = require('http').Server(app)

app.set('port', (process.env.PORT || 3000))

let partialLoad = false

const loadSearchIndex = function () {
  partialLoad = false
  search.buildIndex(recipeRoot, index)
  // HUGE HACK
  fs.readFile('.git/HEAD', function (error, contents) {
    if (error) throw error
    const branch = utils.stripNewLine(contents.toString('utf8').split(' ')[1])
    const branchFile = path.join('.git', branch)
    fs.readFile(branchFile, function (error, commit) {
      if (error) throw error
      hash = utils.stripNewLine(commit.toString('utf8'))
    })
  })
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
  log.debug('Recieved ' + message)
  if (message in messageMap) {
    messageMap[message]()
  } else {
    log.error('Unknown message "' + message + '"')
  }
})

const logRequest = function (request) {
  log.debug(
    'Request: ' + request.path + ' ' + JSON.stringify(request.query)
  )
}

const sendTemplate = function (request, response, key, data) {
  // don't do anything fancy yet
  data['hash'] = hash
  console.log(data)
  response.send(templates[key](data))
}

app.get('/', function (request, response) {
  logRequest(request)
  const locals = {
    recipes: fileList.generateFileList()
  }
  sendTemplate(request, response, 'index', locals)
})

app.get('/conversion', function (request, response) {
  logRequest(request)
  // A list of the conversions that we cover.
  sendTemplate(
    request,
    response,
    'conversion',
    {conversions: conversion.conversions}
  )
})

app.get('/public/*', function (request, response) {
  logRequest(request)
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
  data['results'] = results
  data['time'] = timer.milliseconds
}

app.get('/search', function (request, response) {
  logRequest(request)
  const data = {
    query: request.query.query
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
