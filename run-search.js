#!/usr/bin/env node
'use strict'

const search = require('./search')

const runSearch = function (query) {
  let index = []
  search.buildIndex('public/recipes', index)
  const searchIndex = function () {
    const results = search.search(query, index)
    results.forEach(result => {
      console.log(result.label)
    })
  }
  const waitForIndex = function () {
    if (index.length > 100) {
      searchIndex()
      return
    }
    setTimeout(waitForIndex, 50)
  }
  waitForIndex()
}

runSearch('peanut')
