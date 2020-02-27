'use strict'
const utils = require('./utils')
const tags = require('./tags')

const initialiseAllTags = function () {
  utils.foreachRecipe('public/recipes', function (recipePath) {
    if (!tags.tagsExists(recipePath)) {
      tags.initialiseTags(recipePath)
    }
    const ignoreErrors = true
    const t = tags.readTagsSync(recipePath, ignoreErrors)
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
    tags.writeTagsSync(recipePath, t)
  })
}

module.exports.initialiseAllTags = initialiseAllTags
