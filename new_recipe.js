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

const newRecipe = function (name, directory, callback) {
  const md = recipeMd(name)
  const fileName = path.join(directory, recipeFileName(name))
  fs.writeFile(fileName, md, callback)
}

const main = function () {
  const program = require('commander')
  program
    .version('1.0.0')
    .parse(process.argv)
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
