'use strict'
const utils = require('./utils')
const metadata = require('./metadata')

const initialiseAllMetadata = function () {
  utils.foreachRecipe('public/recipes', function (recipePath) {
    if (!metadata.tagsExists(recipePath)) {
      metadata.initialiseMetadata(recipePath)
    }
    const ignoreErrors = true
    const t = metadata.readMetadataSync(recipePath, ignoreErrors)
    if (recipePath.search('Vegan') !== -1) {
      const recipeMetadata = t['tags']
      if (!recipeMetadata.includes('vegan')) {
        recipeMetadata.push('vegan')
      }
    }
    if (!t['date']) {
      // New recipe with no date, write one now
      const date = new Date()
      t['date'] = utils.formatDate(date)
    }
    metadata.writeMetadataSync(recipePath, t)
  })
}

module.exports.initialiseAllMetadata = initialiseAllMetadata
