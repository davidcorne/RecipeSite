'use strict'
const fs = require('graceful-fs')

const utils = require('./utils')
const log = require('./log')
const metadata = require('./metadata')

class Match {
  constructor () {
    this.singleInstanceCount = 0
    this.wholeWordCount = 0
    this.wholePhraseCount = 0
    this.tagCount = 0
    this.allUsed = false
    this.fileName = false
  }

  score () {
    return (this.singleInstanceCount * 1) +
           (this.wholeWordCount * 2) +
           (this.wholePhraseCount * 4) +
           (this.tagCount * 20) +
           (this.allUsed ? 10 : 0) +
           (this.fileName ? 40 : 0)
  }

  found () {
    return this.score() > 0
  }
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

  // Now work out how well it matches, points for each mention of each word, more points for each
  // use of the whole phrase, and some points for the word appearing whole. e.g. mum not maximum.
  // Also build the context array at this point
  const keys = Object.keys(contextMap).sort()
  const context = []
  const lowerContextArray = []
  // const singleInstanceFactor = (matchingConstants.SingleInstance / queryArray.length)
  const match = new Match()
  keys.forEach(key => {
    const line = contextMap[key]
    const lowerLine = line.toLowerCase()
    queryArray.forEach(queryPart => {
      if (lowerLine.indexOf(queryPart) > -1) {
        match.singleInstanceCount += utils.occurrences(lowerLine, queryPart, false)
        // Now check if there is an instance of the whole word on this line
        const wholeWordRegexp = new RegExp('\\b' + queryPart + '\\b')
        if (lowerLine.match(wholeWordRegexp)) {
          match.wholeWordCount += 1
        }
      }
    })
    // If it's a phrase, find if the whole phrase is used
    if (queryArray.length > 1 && lowerLine.indexOf(query) > -1) {
      match.wholePhraseCount += 1
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
    match.allUsed = true
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
    // Search the file
    const contextResult = searchContext(query, content)
    const match = contextResult.match

    // Search the file path for the query
    const file = item.file
    if (utils.removeDiacritic(file.toLowerCase()).indexOf(query) > -1) {
      // As the search query is in the title, I think it's pretty related to
      // the search, give it a high gearing
      match.fileName = true
    }
    item.tags.forEach(function (tag) {
      if (tag.indexOf(query) > -1) {
        match.tagCount += 1
      }
    })

    if (match.found()) {
      const resultItem = utils.searchItemToResult(item)
      resultItem.context = contextResult.context
      resultItem.match = match.score()
      resultItem.matchVerbose = match
      results.push(resultItem)
    }
  })
  // Sort the results by the larger match is better (closer to the beginning)
  const resultSorter = function (a, b) {
    return b.match - a.match
  }
  return results.sort(resultSorter)
}

const readCacheFile = function (file, callback) {
  if (utils.recipeFile(file)) {
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
      metadata.readMetadata(file, function (metadata) {
        index.push({
          file,
          content,
          'tags': metadata.tags,
          'date': metadata.date,
          'image': metadata.image
        })
      })
    })
  }
  log.debug('Building search index.')
  utils.walk(path, readFileCallback)
}

module.exports.search = search
module.exports.buildIndex = buildIndex
