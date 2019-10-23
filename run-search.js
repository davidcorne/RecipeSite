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
  let currentLength = 0
  const waitForIndex = function () {
    if (index.length > 0 && index.length === currentLength) {
      searchIndex()
      return
    }
    currentLength = index.length
    setTimeout(waitForIndex, 10)
  }
  waitForIndex()
}

runSearch('peanut')
