'use strict'
const fs = require('graceful-fs')
const path = require('path')

const utils = require('./utils')

const BASEPATH = 'public/recipes'

const directoryToItem = function (relativeDirectory) {
  // Make the id so that it's the relative directory name, but sanitised
  // without spaces or slashes that you can't use in a url.
  const id = relativeDirectory.replace(/[ \\\\/]/g, '_').toLowerCase()
  const item = {
    label: path.basename(relativeDirectory),
    id: id,
    files: [],
    directories: []
  }
  const dir = path.join(BASEPATH, relativeDirectory)
  const files = fs.readdirSync(dir)
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      item.directories.push(directoryToItem(path.join(relativeDirectory, file)))
    } else {
      const pth = path.join(dir, file)
      const extension = path.extname(pth)
      if (extension !== '.cache' && extension !== '.tags') {
        if (pth.substr(pth.length - 1) !== '~') {
          item.files.push({
            path: pth,
            label: utils.pathToLabel(pth)
          })
        }
      }
    }
  })
  return item
}

const generateFileList = function () {
  const fileList = []
  const files = [
    'Breakfast',
    'Mains',
    'Dessert',
    'Other'
  ]
  files.forEach(function (file) {
    fileList.push(directoryToItem(file))
  })
  return fileList
}

module.exports.generateFileList = generateFileList
