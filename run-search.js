#!/usr/bin/env node
'use strict'
const yargs = require('yargs')
const search = require('./search')

let index = []

const runSearch = function (query) {
  const results = search.search(query, index)
  results.forEach(result => {
    console.log(result.label)
  })
}

const runSearches = function (queries) {
  search.buildIndex('public/recipes', index)
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
    // length, i.e. should be no more to fine.
    if (index.length > 0 && index.length === currentLength) {
      continueSearch()
      return
    }
    currentLength = index.length
    setTimeout(waitForIndex, 10)
  }
  waitForIndex()
}

const args = yargs // eslint-disable-line
  .command('$0', 'Search the recipes')
  .help()
  .alias('h', 'help')
  .argv

runSearches(args._)
