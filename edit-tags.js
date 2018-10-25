'use strict'
const utils = require('./utils')
const tags = require('./tags')

const initialiseAllTags = function () {
  utils.foreachRecipe('public/recipes', function (recipePath) {
    if (!tags.tagsExists(recipePath)) {
      tags.initialiseTags(recipePath)
    }
    const t = tags.readTagsSync(recipePath)
    if (recipePath.search('Vegan') !== -1) {
      const recipeTags = t['tags']
      if (!recipeTags.includes('vegan')) {
        recipeTags.push('vegan')
      }
    }
    tags.writeTagsSync(recipePath, t)
  })
}

module.exports.initialiseAllTags = initialiseAllTags
