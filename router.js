'use strict'
const pug = require('pug')
const decode = require('urldecode')
const path = require('path')
const fs = require('fs')

const log = require('./log')
const fileList = require('./file-list')
const conversion = require('./conversion')

class Router {
  constructor (app) {
    this.app = app
    this.debugView = false
    this.templates = {
      'index': pug.compileFile('template/index.pug'),
      'search': pug.compileFile('template/search.pug'),
      'new': pug.compileFile('template/new.pug'),
      'new-not-ready': pug.compileFile('template/new-not-ready.pug'),
      'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
      'conversion': pug.compileFile('template/conversion.pug'),
      '404': pug.compileFile('template/404.pug')
    }
    this.gitCommitSHA = ''
  }

  onRequest (request) {
    log.debug(
      'Request: ' + request.path + ' ' + JSON.stringify(request.query)
    )
    this.debugView = 'debug' in request.query
  }

  sendTemplate (request, response, key, data) {
    data.debugView = this.debugView
    data.git_commit_sha = this.gitCommitSHA
    response.send(this.templates[key](data))
  }

  handle404 (request, response, reason) {
    this.onRequest(request)
    response.status(404)
    this.sendTemplate(request, response, '404', {'reason': reason, 'path': request.path})
  }

  // Routes
  root (request, response) {
    this.onRequest(request)
    const locals = {
      recipes: fileList.generateFileList()
    }
    this.sendTemplate(request, response, 'index', locals)
  }
  newRecipes (request, response) {
    this.onRequest(request)
    if (Object.keys(INDEX).length === 0) {
      // Send a "new" results not ready signal.
      this.sendTemplate(request, response, 'new-not-ready', {})
    } else {
      const locals = {
        newRecipes: fileList.filterNewRecipes(INDEX)
      }
      this.sendTemplate(request, response, 'new', locals)
    }
  }

  conversion (request, response) {
    this.onRequest(request)
    // A list of the conversions that we cover.
    this.sendTemplate(
      request,
      response,
      'conversion',
      {conversions: conversion.conversions}
    )
  }
  public (request, response) {
    this.onRequest(request)
    const filePath = path.join(__dirname, decode(request.path))
    fs.stat(filePath, function (error, stats) {
      if (error) {
        this.handle404(request, response, 'Resource not found')
      } else {
        response.sendFile(filePath)
      }
    })
  }

  search (request, response) {
    this.onRequest(request)
    const data = {
      query: request.query.query,
      page: request.query.page ? request.query.page : 1
    }
    if (Object.keys(INDEX).length === 0) {
      // Send a search results not ready signal.
      this.sendTemplate(request, response, 'search-not-ready', data)
    } else {
      this.searchIndex(data)
      this.sendTemplate(request, response, data.key, data)
    }
  }

  pageNotFound (request, response) {
    this.handle404(request, response, 'Unknown Page')
  }
}

module.exports.Router = Router
