const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const recipeFileName = function (name) {
  return name + '.md'
}

const recipeMd = function (name) {
  const md = `# ` + name + ` # 

## Ingredients ## 


## Method ## 

°C ½ ¼

`
  return md
}

const recipeFilePath = function (directory, name) {
  return path.join(directory, recipeFileName(name))
}

const newRecipe = function (name, directory, callback) {
  const md = recipeMd(name)
  fs.writeFile(recipeFilePath(directory, name), md, callback)
}

const parseBbcGoodFoodIngredients = function ($) {
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

const parseBbcGoodFoodMethod = function ($) {
  return []
}

const parseBbcGoodFoodRecipe = function (url, html, callback) {
  const $ = cheerio.load(html)
  const ingredients = parseBbcGoodFoodIngredients($).map(
    i => `- ${i}
`
  ).join('')
  const title = ''
  const method = parseBbcGoodFoodMethod($)
  const markdown = `# ${title} #

## Ingredients ## 

${ingredients}

## Method ## 

${method}

`
  callback(markdown)
}

const newRecipeFromUrl = function (url, directory, callback) {
  // Get html from url
  const html = ''
  const name = ''
  // Parse the html
  parseBbcGoodFoodRecipe(url, html, function (markdown) {
    fs.writeFile(recipeFilePath(directory, name), markdown, callback)
  })
}

const main = function () {
  const program = require('commander')
  program
    .version('1.0.0')
    .option('-u, --url <url>', 'Create a recipe from that URL')
    .parse(process.argv)
  const url = program.opts().url
  if (url) {
    newRecipeFromUrl(url, '.', function (error) {
      if (error) {
        throw error
      }
      console.log('Wrote recipe from', url)
    })
  }
  program.args.forEach(recipe => {
    newRecipe(recipe, '.', function (error) {
      if (error) {
        throw error
      }
      console.log('Wrote', recipe)
    })
  })
}

if (require.main === module) {
  main()
}
