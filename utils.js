'use strict'

const path = require('path')
const fs = require('graceful-fs')

const walk = function (dir, callback) {
  fs.readdir(dir, function (error, files) {
    if (error) {
      throw error
    }
    files.forEach(function (file) {
      const fullPath = path.join(dir, file)
      fs.stat(fullPath, function (error, stats) {
        if (error) {
          throw error
        }
        if (stats.isDirectory()) {
          walk(fullPath, callback)
        } else {
          callback(fullPath)
        }
      })
    })
  })
}

const pathToLabel = function (pth) {
  return path.basename(pth, path.extname(pth))
}

const changeExtension = function (fileName, newExtension) {
  const position = fileName.lastIndexOf('.')
  return fileName.substr(0, position < 0 ? fileName.length : position) + newExtension
}

/**
 * Get the domain name from a url
 * e.g. domainName('www.example.com/search?test=true') = example.com
 * @param {String} url
 */
const domainName = function (url) {
  const baseUrl = url.replace(/(https?:\/\/)?(www.)?/i, '')

  if (baseUrl.indexOf('/') !== -1) {
    return baseUrl.split('/')[0]
  }

  return baseUrl
}

/**
 * A function to change a string to title case.
 * e.g. titleCase('hello there, my name is Dave') -> 'Hello There, My Name Is Dave'
 * @param {String} str
 */
const titleCase = function (str) {
  str = str.toLowerCase().split(' ')
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1)
  }
  return str.join(' ')
}

const cachePath = function (file) {
  return changeExtension(file, '.cache')
}

const timer = function () {
  this.start = function () {
    this.time = process.hrtime()
    return this
  }
  this.stop = function () {
    const end = process.hrtime(this.time)[1] / 1000000
    this.milliseconds = Math.round(end * 100) / 100
  }
  return this
}

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
function occurrences (string, subString, allowOverlapping) {
  string += ''
  subString += ''
  if (subString.length <= 0) {
    return (string.length + 1)
  }

  let n = 0
  let pos = 0
  let step = allowOverlapping ? 1 : subString.length

  while (true) {
    pos = string.indexOf(subString, pos)
    if (pos >= 0) {
      ++n
      pos += step
    } else {
      break
    }
  }
  return n
}

const isRecipe = function (file) {
  const extension = path.extname(file)
  // Recipes are either html, md, pdf or jpg
  return extension === '.html' || extension === '.md' || extension === '.pdf' || extension === '.jpg' || extension === '.png'
}
const foreachRecipe = function (directory, predicate) {
  walk(directory, function (file) {
    if (isRecipe(file)) {
      predicate(file)
    }
  })
}

const removeDiacritic = function (string) {
  // Normalise the content to NFC, and remove diacritics.
  // e.g. 'brulée' -> 'brulee'
  // See more: https://stackoverflow.com/a/37511463/1548429
  return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const formatDate = function (date) {
  return date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
}

const pathToDisplayPath = function (file) {
  // comes in as public\recipes\A\B\C.X want to display A/B/C
  let displayPath = file.replace(/\\/g, '/')
  displayPath = displayPath.replace('public/recipes/', '')
  displayPath = displayPath.replace(/\..*/, '')
  return displayPath
}

/** Function that identifies a file as a recipe file or not
 * @param {String} file               The file path
 *
 * @return {Boolean} Returns if the file is a recipe.
 */
const recipeFile = function (file) {
  const ext = path.extname(file)
  return ext !== '.cache' && ext !== '.metadata'
}

/** Function to get an image path from a search item
 *
 * @param {SearchItem} item
 *
 * @returns {String} path to an image to display
 */
const imageFromRecipe = function (content) {
  const markdownImage = new RegExp('!\\[.*\\]\\((.*)\\)')
  const matches = content.match(markdownImage)
  return matches ? matches[1] : ''
}

/** Function to read a recipe and get the image from it
 *
 * @param {string} recipePath
 *
 * @returns {String} image, can be empty
 */
const readImageFromRecipeSync = function (recipePath) {
  const extension = path.extname(recipePath)
  if (extension === '.html') {
    const content = fs.readFileSync(recipePath)
    return imageFromRecipe(String(content))
  }
  return ''
}

/** Function to convert from a search index item to a result item
 * @param {SearchItem} item   The item to convert to a result
 *
 * @returns {ResultItem} The result with all of the instrumentation needed
 */
const searchItemToResult = function (item) {
  return {
    label: pathToLabel(item.file),
    path: item.file,
    displayPath: pathToDisplayPath(item.file),
    tags: item.tags,
    date: item.date,
    image: item.image
  }
}

module.exports.occurrences = occurrences
module.exports.pathToLabel = pathToLabel
module.exports.cachePath = cachePath
module.exports.changeExtension = changeExtension
module.exports.walk = walk
module.exports.timer = timer
module.exports.foreachRecipe = foreachRecipe
module.exports.isRecipe = isRecipe
module.exports.removeDiacritic = removeDiacritic
module.exports.formatDate = formatDate
module.exports.pathToDisplayPath = pathToDisplayPath
module.exports.recipeFile = recipeFile
module.exports.searchItemToResult = searchItemToResult
module.exports.readImageFromRecipeSync = readImageFromRecipeSync
module.exports.titleCase = titleCase
module.exports.domainName = domainName
