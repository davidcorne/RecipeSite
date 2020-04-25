'use strict'
const fs = require('graceful-fs')
const path = require('path')

const utils = require('./utils')

const directoryToItem = function (basePath, relativeDirectory) {
  // Make the id so that it's the relative directory name, but sanitised
  // without spaces or slashes that you can't use in a url.
  const id = relativeDirectory.replace(/[ \\\\/]/g, '_').toLowerCase()
  const item = {
    label: path.basename(relativeDirectory),
    id,
    files: [],
    directories: []
  }
  const dir = path.join(basePath, relativeDirectory)
  const files = fs.readdirSync(dir)
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      item.directories.push(directoryToItem(basePath, path.join(relativeDirectory, file)))
    } else {
      const pth = path.join(dir, file)
      if (utils.recipeFile(pth)) {
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
    fileList.push(directoryToItem('public/recipes', file))
  })
  return fileList
}

const filterNewRecipes = function (index) {
  const orderPredicate = (a, b) => {
    if (a.date !== b.date) {
      return a.date > b.date ? -1 : a.date < b.date ? 1 : 0
    }
    // If the dates are equal, sort by file
    const labelA = utils.pathToLabel(a.file)
    const labelB = utils.pathToLabel(b.file)
    return labelA < labelB ? -1 : labelA > labelB ? 1 : 0
  }
  const orderedRecipes = []
  const orderedIndex = index.slice()
  orderedIndex.sort(orderPredicate)
  for (let i = 0; i < orderedIndex.length; ++i) {
    const item = orderedIndex[i]
    const firstLines = item.content.split(/\r?\n/).slice(0, 5)
    orderedRecipes.push({
      'path': item.file,
      'label': utils.pathToLabel(item.file),
      'displayPath': utils.pathToDisplayPath(item.file),
      'context': firstLines,
      'tags': item.tags,
      'date': item.date
    })
  }
  return orderedRecipes
}

module.exports.generateFileList = generateFileList
module.exports.filterNewRecipes = filterNewRecipes
