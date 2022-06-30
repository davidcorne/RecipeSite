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
const configuration = require('./configuration')
const search = require('./search')
const fileList = require('./file-list')

// non const for rewire
let INDEX = [] // eslint-disable-line prefer-const
const RECIPE_ROOT = 'public/recipes'

let SPELL = null

// Compile a function
const TEMPLATES = {
  index: pug.compileFile('template/index.pug'),
  images: pug.compileFile('template/images.pug'),
  search: pug.compileFile('template/search.pug'),
  new: pug.compileFile('template/new.pug'),
  'new-not-ready': pug.compileFile('template/new-not-ready.pug'),
  'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
  404: pug.compileFile('template/404.pug')
}

const APP = express()
const HTTP = require('http').Server(APP)

APP.set('port', configuration.port)

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

/** Function to handle routing of a file
 * @param {String} filePath
 * @param {*} response
 */
const routeFile = function (filePath, response) {
  const extension = path.extname(filePath)
  if (extension === '.md') {
    // Markdown files need some processing
    fs.readFile(filePath, function (error, content) {
      if (error) {
        throw error
      }
      // TODO: replace this with a template
      response.send(`
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>

<title>${utils.pathToLabel(filePath)}</title>

<xmp theme="cerulean" style="display:none">
${content}
</xmp>
<script src="/public/resources/strapdown.js"></script>
<script src="/public/resources/recipe-formatting.js"></script>
`)
    })
  } else {
    response.sendFile(filePath)
  }
}

APP.get('/public/*', function (request, response) {
  onRequest(request)
  const filePath = path.join(__dirname, decode(request.path))
  fs.stat(filePath, function (error, stats) {
    if (error) {
      handle404(request, response, 'Resource not found')
    } else {
      routeFile(filePath, response)
    }
  })
})

APP.get('/images', function (request, response) {
  onRequest(request)
  fs.readdir(path.join(__dirname, 'public/images'), function (error, files) {
    if (error) {
      handle404(request, response, 'Internal error: images not found')
    } else {
      sendTemplate(request, response, 'images', { imagePaths: files })
    }
  })
})

APP.get('/influences', function (request, response) {
  onRequest(request)
  response.redirect('/public/Influences.html')
})

const searchIndex = function (data) {
  // We've got a search index, actually search it.
  const timer = utils.timer().start()
  const results = search.search(data.query, INDEX)
  timer.stop()
  data.key = 'search'
  // See if it's well spelled, as long as we've loaded a spellchecker
  let suggestions = []
  if (SPELL) {
    suggestions = SPELL.suggest(data.query)
  }
  data.suggestions = suggestions
  data.results_length = results.length
  data.time = timer.milliseconds
  // slice the search data by the page
  const bottom = (data.page - 1) * 20
  const top = Math.min(data.page * 20, results.length)
  data.results = results.slice(bottom, top)
  // For display add 1, as they're not array indices.
  data.bottom = bottom + 1
  data.top = top
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
  response.redirect(`/404?reason=${reason}`)
}

APP.get('/404', function (request, response) {
  onRequest(request)
  sendTemplate(request, response, '404', {reason: request.query.reason, path: request.path})
})

// Note: This should always be the last route, as otherwise it'll override the other routes.
APP.get('*', function (request, response) {
  handle404(request, response, 'Unknown Page')
})

module.exports.start = start

// Allow you to run the worker as a single process if you don't need the cluster.
if (require.main === module) {
  start()
}
