'use strict'
const utils = require('./utils')
const metadata = require('./metadata')

const initialiseAllMetadata = function () {
  utils.foreachRecipe('public/recipes', function (recipePath) {
    if (!metadata.metadataExists(recipePath)) {
      metadata.initialiseMetadata(recipePath)
    }
    const ignoreErrors = true
    const t = metadata.readMetadataSync(recipePath, ignoreErrors)
    if (recipePath.search('Vegan') !== -1) {
      const recipeTags = t['tags']
      if (!recipeTags.includes('vegan')) {
        recipeTags.push('vegan')
      }
    }
    if (!t['date']) {
      // New recipe with no date, write one now
      const date = new Date()
      t['date'] = utils.formatDate(date)
    }
    if (!t['image']) {
      // A recipe with no image, write a blank one for now
      t['image'] = ''
    }
    metadata.writeMetadataSync(recipePath, t)
  })
}

module.exports.initialiseAllMetadata = initialiseAllMetadata
