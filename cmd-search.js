#!/usr/bin/env node
'use strict'
const commander = require('commander')
const search = require('./search')

let INDEX = []

const runSearch = function (query) {
  const results = search.search(query, INDEX)
  results.forEach(result => {
    console.log(result.label)
    if (commander.context) {
      result.context.forEach(line => {
        console.log(' ', line)
      })
    }
  })
}

const runSearches = function (queries) {
  search.buildIndex('public/recipes', INDEX)
  const continueSearch = function () {
    queries.forEach(query => {
      console.log('Query:', query)
      runSearch(query)
      console.log('')
    })
  }
  let currentLength = 0
  const waitForIndex = function () {
    // Wait until 2 iterations of reading the search index have the same
    // length, i.e. should be no more to find.
    if (INDEX.length > 0 && INDEX.length === currentLength) {
      continueSearch()
      return
    }
    currentLength = INDEX.length
    setTimeout(waitForIndex, 10)
  }
  waitForIndex()
}

commander
  .option('-c, --context', 'show the context of the recipe')
  .parse(process.argv)

runSearches(commander.args)
