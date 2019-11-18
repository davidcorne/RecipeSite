'use strict'
const fs = require('graceful-fs')
const path = require('path')

const utils = require('./utils')
const log = require('./log')
const tags = require('./tags')

const matchingConstants = {
  SingleInstance: 1,
  AllUsed: 10,
  WholePhrase: 4,
  FileName: 40,
  Tag: 20
}

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
  const contextMap = {}
  const lowerContent = content.toLowerCase()
  const queryArray = query.split(' ')
  const lines = content.split(/\r?\n/)

  // Gather all of the context
  queryArray.forEach(part => {
    if (lowerContent.indexOf(part) > -1) {
      // Found something
      for (const [index, line] of lines.entries()) {
        if (line.toLowerCase().indexOf(part) > -1) {
          contextMap[index] = line
        }
      }
    }
  })

  // Now work out how well it matches, 1 point for each mention of each word, 4 for each whole phrase.
  // Also build the context array at this point
  const keys = Object.keys(contextMap).sort()
  const context = []
  const lowerContextArray = []
  const singleInstanceFactor = (matchingConstants.SingleInstance / queryArray.length)
  let match = 0
  keys.forEach(key => {
    const line = contextMap[key]
    const lowerLine = line.toLowerCase()
    queryArray.forEach(queryPart => {
      if (lowerLine.indexOf(queryPart) > -1) {
        match += singleInstanceFactor * utils.occurrences(lowerLine, queryPart, false)
      }
    })
    // find the whole phrase
    if (lowerLine.indexOf(query) > -1) {
      match += matchingConstants.WholePhrase
    }
    context.push(line)
    lowerContextArray.push(lowerLine)
  })

  const lowerContext = lowerContextArray.join('\n')
  // Find if each component of the phrase was used. Just look in the context so you're searching less
  let allUsed = true
  queryArray.forEach(word => {
    // If we don't find it, set it false and stop
    if (lowerContext.indexOf(word) === -1) {
      allUsed = false
    }
  })
  if (allUsed) {
    match += matchingConstants.AllUsed
  }
  return {
    context: context,
    match: match
  }
}

const search = function (query, index) {
  query = utils.removeDiacritic(query.toLowerCase().trim())
  const results = []
  index.forEach(function (item) {
    const content = item.content
    // A metric of how good a match it is
    let match = 0

    // Search the file path for the query
    const file = item.file
    if (utils.removeDiacritic(file.toLowerCase()).indexOf(query) > -1) {
      // As the search query is in the title, I think it's pretty related to
      // the search, give it a high gearing
      match += matchingConstants.FileName
    }
    item.tags.forEach(function (tag) {
      if (tag.indexOf(query) > -1) {
        match += matchingConstants.Tag
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
        tags: item.tags,
        match
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
            if (error) {
              throw error
            }
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
          file,
          content,
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
