#!/usr/bin/env node

const newRecipe = function (name) {
  console.log(name)
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

main()
