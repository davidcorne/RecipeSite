'use strict'
const fs = require('graceful-fs')
const path = require('path')

const utils = require('./utils')
const log = require('./log')
const tags = require('./tags')

const pathToDisplayPath = function (file) {
  // comes in as public\recipes\A\B\C.X want to display A/B/C
  let displayPath = file.replace(/\\/g, '/')
  displayPath = displayPath.replace('public/recipes/', '')
  displayPath = displayPath.replace(/\..*/, '')
  return displayPath
}

const searchContext = function (query, content) {
  // Note: content comes in mixed case, so that the context is added in the
  // correct case for the user.
  const context = []
  if (content.toLowerCase().indexOf(query) > -1) {
    // Found something
    // make the context. Each line where the query appears.
    const lines = content.split(/\r?\n/)

    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].toLowerCase().indexOf(query) > -1) {
        context.push(lines[i])
      }
    }
  }
  return {
    context: context,
    match: utils.occurrences(content.toLowerCase(), query, false)
  }
}

const search = function (query, index) {
  query = query.toLowerCase()
  const results = []
  index.forEach(function (item) {
    const content = item.content
    // A metric of how good a match it is
    let match = 0

    // Search the file path for the query
    const file = item.file
    if (file.toLowerCase().indexOf(query) > -1) {
      // As the search query is in the title, I think it's pretty related to
      // the search, give it a high gearing
      match += 20
    }
    item.tags.forEach(function (tag) {
      if (tag.indexOf(query) > -1) {
        match += 5
      }
    })
    // Search the file
    const contextResult = searchContext(query, content)
    match += contextResult.match

    if (match > 0) {
      results.push({
        label: utils.pathToLabel(file),
        path: file,
        displayPath: pathToDisplayPath(file),
        context: contextResult.context,
        match: match
      })
    }
  })
  // Sort the results by the larger match is better (closer to the beginning)
  const resultSorter = function (a, b) {
    return b.match - a.match
  }
  return results.sort(resultSorter)
}

const readCacheFile = function (file, callback) {
  if (path.extname(file) !== '.cache' && path.extname(file) !== '.tags') {
    // Read the cached file.
    const cacheFileName = utils.cachePath(file)
    fs.stat(cacheFileName, function (error, cacheStats) {
      if (error && error.code === 'ENOENT') {
        // The cache doesn't exist, we could be in a partial search.
      } else {
        fs.readFile(
          cacheFileName,
          'utf8',
          function (error, content) {
            if (error) throw error
            // We don't want the first line, as it's the hash
            const hashless = content.split('\n').slice(1).join('\n')
            callback(hashless)
          }
        )
      }
    })
  }
}

const buildIndex = function (path, index) {
  const readFileCallback = function (file) {
    readCacheFile(file, function (content) {
      tags.readTags(file, function (tags) {
        index.push({
          'file': file,
          'content': content,
          'tags': tags.tags
        })
      })
    })
  }
  log.debug('Building search index.')
  utils.walk(path, readFileCallback)
}

module.exports.search = search
module.exports.buildIndex = buildIndex
