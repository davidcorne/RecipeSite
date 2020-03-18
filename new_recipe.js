const fs = require('fs')
const path = require('path')

const recipeFileName = function (name) {
  return name + '.html'
}

const recipeHtml = function (name) {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  </head>
  
  <title>` + name + `</title>
  
  <xmp theme="cerulean" style="display:none;">
# ` + name + ` # 

## Ingredients ## 


## Method ## 

°C ½ ¼

</xmp>
  
  <script src="/public/resources/strapdown.js"></script>
  <script src="/public/resources/recipe-formatting.js"></script>
</html>
  
  `
  return html
}

const newRecipe = function (name, directory, callback) {
  const html = recipeHtml(name)
  const fileName = path.join(directory, recipeFileName(name))
  fs.writeFile(fileName, html, callback)
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
