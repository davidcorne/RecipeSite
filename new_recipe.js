const fs = require('fs')
const path = require('path')

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

const parseBbcGoodFoodRecipe = function (url, html, callback) {
  callback(html)
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
