'use strict'
const fs = require('graceful-fs')
const path = require('path')
const PDFParser = require('pdf2json')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const md5 = require('md5-file')
const firstline = require('firstline')

const utils = require('./utils')
const log = require('./log')

const PDF_QUEUE = []

const getHtmlCacheContent = function (file, callback) {
  fs.readFile(file, 'utf8', function (error, content) {
    if (error) {
      throw error
    }
    const dom = new JSDOM(content)
    let markdown = ''
    const title = dom.window.document.getElementsByTagName('title')[0]
    markdown += title.innerHTML
    const xmp = dom.window.document.getElementsByTagName('xmp')[0]
    // Some are just HTML, they won't have a markdown element.
    if (xmp) {
      markdown += xmp.innerHTML
    }
    callback(markdown)
  })
}

const getMdCacheContent = function (file, callback) {
  fs.readFile(file, 'utf8', function (error, content) {
    if (error) {
      throw error
    }
    callback(content)
  })
}

const getPdfCacheContent = function (file, callback) {
  log.silly('Caching ' + file)
  const pdfParser = new PDFParser(this, 1)
  pdfParser.on('pdfParser_dataReady', function (pdfData) {
    const text = pdfParser.getRawTextContent()
    const content = utils.pathToLabel(file) + '\n' + text
    callback(content)
    getNextPdf(callback)
  })
  pdfParser.on('pdfParser_dataError', function (errData) {
    log.error(errData)
    getNextPdf(callback)
  })
  pdfParser.loadPDF(file)
}

const getNextPdf = function (callback) {
  if (PDF_QUEUE.length) {
    const file = PDF_QUEUE.pop()
    getPdfCacheContent(file, callback)
  }
}

const getOtherCacheContent = function (file, callback) {
  // We don't know how to get content from this file (it's probably an
  // image) so settle for returning the file name.
  callback(utils.pathToLabel(file))
}

const getCacheContent = function (file, callback) {
  const extension = path.extname(file)
  if (extension === '.html') {
    getHtmlCacheContent(file, callback)
  } else if (extension === '.md') {
    getMdCacheContent(file, callback)
  } else if (extension === '.pdf') {
    PDF_QUEUE.push(file)
    if (PDF_QUEUE.length === 1) {
      getNextPdf(callback)
    }
  } else {
    // Not a html or pdf, we don't know exactly how to get content from it
    // (it's probably a picture). So treat it as "other". However we need to
    // ensure that it's not a backup file
    if (file.slice(-1) !== '~') {
      getOtherCacheContent(file, callback)
    }
  }
}

const cacheFile = function (file, callback) {
  getCacheContent(file, function (content) {
    md5(file, function (error, hash) {
      if (error) {
        throw error
      }
      // Remove diacritics from the content
      content = utils.removeDiacritic(content)
      // Now combine the hash, and write it all out.
      content = hash + '\n' + content
      fs.writeFile(utils.cachePath(file), content, 'utf8', function (error) {
        if (error) {
          throw error
        }
        log.silly('Cache written: ' + file)
        callback()
      })
    })
  })
}

const cacheUpdate = function (file, updateFile) {
  const cachePath = utils.cachePath(file)
  fs.stat(cachePath, function (error, cacheStats) {
    if (error && error.code === 'ENOENT') {
      // The cache doesn't exist, make it.
      log.silly('Cache not made yet: ' + file)
      updateFile(true)
    } else if (error) {
      // Another error is a real error!
      throw error
    } else {
      // Check the md5 hashs match
      const cacheMd5 = firstline(cachePath)
      md5(file, function (error, hash) {
        if (error) {
          throw error
        }
        cacheMd5.then(function (cacheHash) {
          if (cacheHash === hash) {
            log.silly('Cache up to date: ' + file)
            updateFile(false)
          } else {
            log.silly('Cache out of date: ' + file)
            updateFile(true)
          }
        }, function (err) {
          throw err
        })
      })
    }
  })
}

const checkFileCache = function (file) {
  const cached = function () {
    // If we are in a child process
    if (process.send) {
      process.send('partial-cache')
    }
  }
  cacheUpdate(file, function (update) {
    if (update) {
      cacheFile(file, cached)
    }
  })
  fs.stat(file, function (error, fileStats) {
    if (error) {
      throw error
    }
  })
}

const buildCache = function (directory) {
  log.info('Building cache of ' + directory)
  utils.foreachRecipe(directory, checkFileCache)
}

module.exports.buildCache = buildCache
