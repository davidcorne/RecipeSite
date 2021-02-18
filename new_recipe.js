const fs = require('fs')
const path = require('path')
const request = require('request')

const urlParser = require('./url-parser')

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

const scrapeUrl = function (url, callback) {
  request(url, {}, (error, response, body) => {
    if (error) {
      throw error
    }
    callback(body)
  })
}

const newRecipeFromUrl = function (url, directory, callback) {
  // Get html from url
  scrapeUrl(url, function (html) {
    try {
      const parser = urlParser.parserFactory(url)

      parser.parseRecipe(url, html, function (markdown) {
        const name = parser.parseTitle(url)
        fs.writeFile(recipeFilePath(directory, name), markdown, callback)
      })
    } catch (error) {
      console.error(error.message)
    }
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
