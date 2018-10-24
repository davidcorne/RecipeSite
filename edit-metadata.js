'use strict'
const utils = require('./utils')
const metadata = require('./metadata')

utils.foreachRecipe('public/recipes', function (recipePath) {
  if (!metadata.metadataExists(recipePath)) {
    metadata.initialiseMetadata(recipePath)
  }
  const md = metadata.readMetadataSync(recipePath)
  if (recipePath.search('Vegan') !== -1) {
    md['diet'].push('vegan')
  }
  metadata.writeMetadataSync(recipePath, md)
})
