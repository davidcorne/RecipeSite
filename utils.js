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
  return fileName.replace(/\..*/, newExtension)
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
  // Recipes are either html, pdf or jpg
  return extension === '.html' || extension === '.pdf' || extension === '.jpg'
}
const foreachRecipe = function (directory, predicate) {
  walk(directory, function (file) {
    if (isRecipe(file)) {
      predicate(file)
    }
  })
}

module.exports.occurrences = occurrences
module.exports.pathToLabel = pathToLabel
module.exports.cachePath = cachePath
module.exports.changeExtension = changeExtension
module.exports.walk = walk
module.exports.timer = timer
module.exports.foreachRecipe = foreachRecipe
module.exports.isRecipe = isRecipe
