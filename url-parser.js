const cheerio = require('cheerio')

const utils = require('./utils')

/**
 * This will return a String representing a recipe in markdown format
 *
 * @param {String} title
 * @param {String} urlText
 * @param {String} url
 * @param {String} ingredientArray
 * @param {String} methodArray
 */
const markdownTemplate = function (title, urlText, url, ingredientArray, methodArray) {
  const ingredients = ingredientArray.map(
    i => `- ${i}
`).join('')
  const method = methodArray.map(
    i => `1. ${i}
`).join('')
  return `# ${title} #

This is a [${urlText}](${url}) recipe.

## Ingredients ##

${ingredients}

## Method ##

${method}
`
}

const parseTitle = function (url) {
  const urlArray = url.split('/')
  let name = ''
  for (let i = urlArray.length - 1; i >= 0; i--) {
    if (urlArray[i]) {
      name = urlArray[i]
      break
    }
  }
  return utils.titleCase(name.split('-').join(' '))
}

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
      if (li.children) {
        for (const sub of li.children) {
          if (sub.nodeValue) {
            appendIngredient(sub.nodeValue)
          } else {
            appendIngredient(sub.firstChild.nodeValue)
          }
        }
        ingredients.push(ingredientArray.join(' '))
      }
    }
    return ingredients
  }

  parseTitle (url) {
    return parseTitle(url)
  }

  markdown (title, url, ingredients, method) {
    return markdownTemplate(title, 'BBC Good Food', url, ingredients, method)
  }

  parseRecipe (url, html, callback) {
    const $ = cheerio.load(html)
    const ingredients = this.parseIngredients($)
    const title = this.parseTitle(url)
    const method = this.parseMethod($)
    const markdown = this.markdown(title, url, ingredients, method)
    callback(markdown)
  }
}

class DefaultParser {
  parseTitle (url) {
    return parseTitle(url)
  }

  parseRecipe (url, html, callback) {
    const title = parseTitle(url)
    const ingredients = []
    const method = []
    const markdown = markdownTemplate(title, title, url, ingredients, method)
    callback(markdown)
  }
}

const PARSER_MAP = {
  'bbcgoodfood.com': BbcGoodFoodParser
}

const parserFactory = function (url) {
  const domain = utils.domainName(url)
  const ParserClass = PARSER_MAP[domain]
  if (ParserClass) {
    return new ParserClass()
  } else {
    return new DefaultParser()
  }
}

module.exports.parserFactory = parserFactory
