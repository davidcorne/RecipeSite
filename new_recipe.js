#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const newRecipe = function (name) {
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
  </html>
  
  `
  const fileName = name + '.html'
  fs.writeFile(fileName, html, function (error) {
    if (error) {
      throw error
    }
    console.log('Wrote', fileName)
  })
}

const main = function () {
  const program = require('commander')
  program
    .version('1.0.0')
    .parse(process.argv)
  program.args.forEach(recipe => {
    newRecipe(recipe)
  })
}

if (require.main === module) {
  main()
}
