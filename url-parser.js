const cheerio = require('cheerio')

const utils = require('./utils')

class BbcGoodFoodParser {
  parseMethod ($) {
    const methodUL = $('.recipe__method-steps')[0].children[1].firstChild
    const methodArray = []
    for (const li of methodUL.children) {
      const content = li.lastChild.firstChild
      const stepArray = []
      const appendMethod = function (part) {
        const trimmed = part.trim()
        if (trimmed) {
          stepArray.push(trimmed)
        }
      }
      for (const sub of content.children) {
        if (sub.nodeValue) {
          appendMethod(sub.nodeValue)
        } else {
          appendMethod(sub.firstChild.nodeValue)
        }
      }
      methodArray.push(stepArray.join(' '))
    }
    return methodArray
  }

  parseIngredients ($) {
    const ingredientHTML = $('.recipe__ingredients')[0].lastChild.firstChild.children
    const ingredients = []
    for (const li of ingredientHTML) {
      const ingredientArray = []
      const appendIngredient = function (i) {
        const trimmed = i.trim()
        if (trimmed) {
          ingredientArray.push(trimmed)
        }
      }
      for (const sub of li.children) {
        if (sub.nodeValue) {
          appendIngredient(sub.nodeValue)
        } else {
          appendIngredient(sub.firstChild.nodeValue)
        }
      }
      ingredients.push(ingredientArray.join(' '))
    }
    return ingredients
  }

  parseTitle (url) {
    const position = url.lastIndexOf('/') + 1
    const name = url.substr(position, url.length)
    return utils.titleCase(name.split('-').join(' '))
  }

  parseRecipe (url, html, callback) {
    const $ = cheerio.load(html)
    const ingredients = this.parseIngredients($).map(
      i => `- ${i}
  `).join('')
    const title = this.parseTitle(url)
    const method = this.parseMethod($).map(
      step => `1. ${step}
  `).join('')
    const markdown = `# ${title} #
  
  This is a [BBC Good Food](${url}) recipe.
  
  ## Ingredients ## 
  
  ${ingredients}
  
  ## Method ## 
  
  ${method}
  
  `
    callback(markdown)
  }
}

module.exports.BbcGoodFoodParser = BbcGoodFoodParser
