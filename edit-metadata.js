'use strict'
const utils = require('./utils')
const metadata = require('./metadata')

utils.foreachRecipe('public/recipes', function (recipePath) {
  const recipeMetadata = {
    'diet': [],
    'cuisine': [],
    'type': 'recipe'
  }
  //   if (recipePath.search('Vegan') !== -1) {
  //     console.log(metadataPath)
  //     metadata['diet'].push('vegan')
  //   }
  metadata.writeMetadataSync(recipePath, recipeMetadata)
})
