'use strict'
const rewire = require('rewire')
const chai = require('chai')
chai.use(require('chai-string'))
const assert = chai.assert
const path = require('path')
const request = require('supertest')
const async = require('async')
const fs = require('fs')

const searchModule = rewire('./search.js')
const buildCacheModule = rewire('./build-cache.js')
const workerModule = rewire('./worker.js')

console.log('Running Unit Tests')

//= ============================================================================
describe('Caches', function () {
  const getHtmlCacheContent = buildCacheModule.__get__('getHtmlCacheContent')
  const getPdfCacheContent = buildCacheModule.__get__('getPdfCacheContent')
  const getOtherCacheContent = buildCacheModule.__get__('getOtherCacheContent')
  const cacheFile = buildCacheModule.__get__('cacheFile')
  it('HTML cache', function (done) {
    getHtmlCacheContent('test_data/generic/test_recipe.html', (content) => {
      var expected = `Test Recipe Title
# Test Recipe #

## Ingredients

- Something

## Method

1. Test the recipe.
`
      assert.strictEqual(content, expected)
      done()
    })
  })
  it('PDF cache', function (done) {
    getPdfCacheContent('test_data/generic/test_recipe.pdf', (content) => {
      assert.include(content, 'Test Recipe')
      assert.include(content, 'Ingredients')
      assert.include(content, 'Something')
      assert.include(content, 'Test the recipe.')
      assert.include(content, 'test_recipe')
      done()
    })
  })
  it('Other cache', function (done) {
    getOtherCacheContent('test_data/generic/test_tree/test_recipe.pdf', (content) => {
      assert.strictEqual(content, 'test_recipe')
      done()
    })
  })
  const testPDFCacheWriting = function (callback) {
    cacheFile('test_data/generic/test_recipe.pdf', function () {
      const cache = 'test_data/generic/test_recipe.cache'
      assert.isOk(fs.existsSync)
      fs.readFile(cache, 'utf8', function (error, content) {
        if (error) throw error
        assert.include(content, 'fbdc7648558d2e55237f92296d61958f')
        fs.unlink(cache, function (error) {
          if (error) throw error
          callback()
        })
      })
    })
  }
  const testHTMLCacheWriting = function (callback) {
    cacheFile('test_data/generic/test_recipe.html', function () {
      const cache = 'test_data/generic/test_recipe.cache'
      assert.isOk(fs.existsSync(cache))
      fs.readFile(cache, 'utf8', function (error, content) {
        if (error) throw error
        assert.include(content, '912dc7447439d9bff54b1002b538db24')
        fs.unlink(cache, function (error) {
          if (error) throw error
          callback()
        })
      })
    })
  }
  it('Cache writing', function (done) {
    testHTMLCacheWriting(function () {
      testPDFCacheWriting(function () {
        done()
      })
    })
  })
})

//= ============================================================================
describe('Search', function () {
  assert.searchResultEqual = function (result, expected) {
    assert.strictEqual(result.label, expected.label)
    assert.strictEqual(result.path, expected.path)
    assert.strictEqual(result.displayPath, expected.displayPath)
    assert.strictEqual(result.match, expected.match)
    assert.strictEqual(result.context.length, expected.context.length)
    for (let i = 0; i < expected.context.length; ++i) {
      assert.strictEqual(result.context[i], expected.context[i])
    }
  }
  it('search', function () {
    const search = searchModule.__get__('search')
    const index = {}
    index[path.join('A', 'B', 'c.path')] = 'This is found'
    index[path.join('A', 'C', 'd.path')] = 'This is FOUND, but longer!'
    index['c'] = 'This is foand'

    const results = search('found', index)
    // This tests:
    //   - finding the label
    //   - manipulating the display path
    //   - getting the match number
    //   - ordering the results by match number
    const expected = [
      {
        label: 'd',
        path: path.join('A', 'C', 'd.path'),
        displayPath: 'A/C/d',
        context: ['This is FOUND, but longer!'],
        match: 'This is FOUND, but longer!'.length
      },
      {
        label: 'c',
        path: path.join('A', 'B', 'c.path'),
        displayPath: 'A/B/c',
        context: ['This is found'],
        match: 'This is found'.length
      }
    ]
    assert.strictEqual(results.length, 2)
    assert.searchResultEqual(results[0], expected[0])
    assert.searchResultEqual(results[1], expected[1])
  })
  it('read cache', function (done) {
    const readCacheFile = searchModule.__get__('readCacheFile')
    const index = {}
    readCacheFile(index, 'test_data/generic/test_cache.html', function (content) {
      assert.notInclude(content, 'fbdc7648558d2e55237f92296d61958f')
      assert.include(content, '# BBQ Marinade')
      done()
    })
  })
})

//= ============================================================================
describe('Routing', function () {
  it('Existing', function (done) {
    const app = workerModule.__get__('app')
    const server = app.listen()

    // Respondes to all the routes.
    const testRoute = function (route, callback) {
      request(server).get(route).expect(200, callback)
    }
    async.each([
      '/',
      '/conversion',
      '/public/resources/index.css',
      '/search'
    ], testRoute, function (error) {
      if (error) throw error
      server.close(done)
    })
  })
  it('Non-existing', function (done) {
    // Try to get some non-existant routes
    const app = workerModule.__get__('app')
    const server = app.listen()

    // Respondes to all the routes.
    const test404 = function (route, callback) {
      request(server).get(route).expect(404, callback)
    }
    async.each([
      '/adsadsahdjasvdb',
      '/public/non-existant'
    ], test404, function (error) {
      if (error) throw error
      server.close(done)
    })
  })
  it('Search not ready', function (done) {
    const app = workerModule.__get__('app')
    const server = app.listen()
    request(server).get('/search?query=bean').expect(200, function (error, response) {
      assert.include(response.text, 'Search results are not ready yet.')
      assert.include(response.text, 'public/resources/search-not-ready.js')
      done()
    })
  })
  it('Search not found', function (done) {
    const app = workerModule.__get__('app')
    const index = {}
    index['test 1'] = 'never found'
    workerModule.__set__('index', index)

    const server = app.listen()
    const runTest = function (callback) {
      request(server).get('/search?query=always').expect(200, function (error, response) {
        if (error) throw error
        assert.include(
          response.text,
          'Your search - always - did not match any documents.'
        )
        callback()
      })
    }
    async.series([
      (cb) => {
        runTest(cb)
      },
      (cb) => {
        workerModule.__set__('partialLoad', true)
        runTest(cb)
      }
    ], function (error) {
      if (error) throw error
      // Clean up after ourselves
      workerModule.__set__('partialLoad', false)
      workerModule.__set__('index', {})
      done()
    })
  })
  it('Search found', function (done) {
    const app = workerModule.__get__('app')
    const index = {}
    index['test 1'] = 'The context of this bean\nNot this line though.'
    index['test 2'] = 'this baen.'
    workerModule.__set__('index', index)

    const server = app.listen()

    const testFull = function (callback) {
      request(server).get('/search?query=a').expect(200, function (error, response) {
        if (error) throw error
        // we care that there were some results, and that it wasn't a
        // partial seach.
        assert.include(response.text, '2 results')
        assert.notInclude(response.text, 'not complete')
        callback()
      })
    }
    const testBean = function (callback) {
      request(server).get('/search?query=bean').expect(200, function (error, response) {
        if (error) throw error
        // We care that it found 1 thing, and it gives you context.
        assert.include(response.text, '1 result')
        assert.include(response.text, 'test 1')
        assert.include(response.text, 'The context of this bean')
        assert.notInclude(response.text, 'Not this line though.')
        callback()
      })
    }
    const testThis = function (callback) {
      request(server).get('/search?query=this').expect(200, function (error, response) {
        // We care that it found 2 things, and it gives you text from
        // both.
        assert.include(response.text, '2 results')
        assert.include(response.text, 'test 1')
        assert.include(response.text, 'test 2')
        assert.include(response.text, 'The context of this bean')
        assert.include(response.text, 'Not this line though.')
        assert.include(response.text, 'this baen.')
        callback()
      })
    }
    const testPartial = function (callback) {
      // Set the partial load flag
      workerModule.__set__('partialLoad', true)
      request(server).get('/search?query=bean').expect(200, function (error, response) {
        // We care that it found 1 things, and it recognises that it's
        // a partial search.
        assert.include(response.text, '1 result')
        assert.include(response.text, 'test 1')
        assert.include(response.text, 'The context of this bean')
        assert.notInclude(response.text, 'Not this line though.')
        assert.include(
          response.text,
          'The search is not complete, here are the first few results.'
        )
        workerModule.__set__('partialLoad', false)
        callback()
      })
    }
    async.series([
      testFull,
      testBean,
      testThis,
      testPartial
    ], function (error) {
      if (error) throw error
      // Clean up after ourselves
      workerModule.__set__('index', {})
      done()
    })
  })
})
