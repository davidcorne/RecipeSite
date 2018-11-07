'use strict'
/* global describe, it */
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
const tagsModule = rewire('./tags.js')

console.log('Running Unit Tests')

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
        if (error) {
          throw error
        }
        assert.include(content, 'fbdc7648558d2e55237f92296d61958f')
        fs.unlink(cache, function (error) {
          if (error) {
            throw error
          }
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
        if (error) {
          throw error
        }
        assert.include(content, '912dc7447439d9bff54b1002b538db24')
        fs.unlink(cache, function (error) {
          if (error) {
            throw error
          }
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
  it('Don\'t delete cache content', function () {
    // fs.unlinkSync('test_data/clear_cache_tree/test_recipe.cache')
  })
})

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
    const index = []
    index.push({
      'file': path.join('A', 'B', 'c.path'),
      'content': 'This is found',
      'tags': []
    })
    index.push({
      'file': path.join('A', 'C', 'd.path'),
      'content': 'This is FOUND, but more found!',
      'tags': []
    })
    index.push({
      'file': 'c',
      'content': 'This is foand',
      'tags': []
    })

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
        context: ['This is FOUND, but more found!'],
        match: 2 // 2 instances of found
      },
      {
        label: 'c',
        path: path.join('A', 'B', 'c.path'),
        displayPath: 'A/B/c',
        context: ['This is found'],
        match: 1 // 1 instance of found
      }
    ]
    assert.strictEqual(results.length, 2)
    assert.searchResultEqual(results[0], expected[0])
    assert.searchResultEqual(results[1], expected[1])
  })
  it('read cache', function (done) {
    const readCacheFile = searchModule.__get__('readCacheFile')
    readCacheFile('test_data/generic/test_cache.html', function (content) {
      assert.notInclude(content, 'fbdc7648558d2e55237f92296d61958f')
      assert.include(content, '# BBQ Marinade')
      done()
    })
  })
  it('title weight', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': 'apple',
        'content': 'title not included',
        'tags': []
      },
      {
        'file': 'title not in data',
        'content': 'but it does have apple',
        'tags': []
      }
    ]
    const results = search('apple', index)
    assert.strictEqual(results.length, 2)
    // The result with the query in the title, should be first
    assert.strictEqual(results[0].label, 'apple')
    assert.strictEqual(results[1].label, 'title not in data')
  })
  it('tags weight', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': '1',
        'content': 'This recipe is of type TAG, it is a TAG recipe.',
        'tags': []
      },
      {
        'file': '2',
        'content': 'but it does have apple',
        'tags': ['tag']
      }
    ]
    const results = search('TAG', index)
    assert.strictEqual(results.length, 2)
    // The result with the query in the tags, should be first
    assert.strictEqual(results[0].label, '2')
    assert.strictEqual(results[1].label, '1')
  })
  it('tags partial match', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': '1',
        'content': 'Nothing',
        'tags': []
      },
      {
        'file': '2',
        'content': 'but it does have apple',
        'tags': ['tag']
      }
    ]
    const results = search('ag', index)
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].label, '2')
  })
  it('Build Index', function (done) {
    const buildIndex = searchModule.__get__('buildIndex')
    let index = []
    buildIndex('test_data/build_index_root', index)
    const testIndex = function () {
      assert.strictEqual(index.length, 1)
      const testRecipe = index[0]
      const filePath = path.join('test_data', 'build_index_root', 'TestRecipe.html')
      assert.strictEqual(testRecipe.file, filePath)
      const stringIndex = testRecipe.content.indexOf('Combine the test and the recipes together in a blender.')
      assert.isAbove(stringIndex, -1)
      assert.strictEqual(testRecipe.tags.length, 2)
      done()
    }
    const waitForIndex = function () {
      if (index.length === 1) {
        testIndex()
        return
      }
      setTimeout(waitForIndex, 10)
    }
    waitForIndex()
  })
  it('Integrated search', function () {
    try {
      const index = [
        {
          'file': '1',
          'content': 'Nothing',
          'tags': []
        },
        {
          'file': '2',
          'content': 'but it does have apple',
          'tags': ['tag']
        }
      ]
      workerModule.__set__('index', index)
      const searchIndex = workerModule.__get__('searchIndex')

      let data = {'query': 'nothing'}
      searchIndex(data)
      assert.isNotNull(data.key)
      assert.isNotNull(data.suggestions)
      assert.isNotNull(data.results)
      assert.isNotNull(data.time)

      // There won't actually be a spelling module set up
      assert.strictEqual(data.suggestions, [])
      assert.strictEqual(data.result.length, 1)
    } finally {
      // Reset what we've changed
      workerModule.__set__('index', [])
    }
  })
})

describe('Routing', function () {
  this.afterEach(function () {
    workerModule.__set__('index', [])
    workerModule.__set__('partialLoad', false)
  })

  it('Existing', function (done) {
    const app = workerModule.__get__('app')
    const server = app.listen()

    // Responds to all the routes.
    const testRoute = function (route, callback) {
      request(server).get(route).expect(200, callback)
    }
    async.each([
      '/',
      '/conversion',
      '/public/resources/index.css',
      '/search'
    ], testRoute, function (error) {
      if (error) {
        throw error
      }
      server.close(done)
    })
  })
  it('Non-existing', function (done) {
    // Try to get some non-existent routes
    const app = workerModule.__get__('app')
    const server = app.listen()

    // Responds to all the routes.
    const test404 = function (route, callback) {
      request(server).get(route).expect(404, callback)
    }
    async.each([
      '/adsadsahdjasvdb',
      '/public/non-existant'
    ], test404, function (error) {
      if (error) {
        throw error
      }
      server.close(done)
    })
  })
  it('Search not ready', function (done) {
    const app = workerModule.__get__('app')
    const server = app.listen()
    request(server).get('/search?query=bean').expect(200, function (error, response) {
      if (error) {
        throw error
      }
      assert.include(response.text, 'Search results are not ready yet.')
      assert.include(response.text, 'public/resources/search-not-ready.js')
      done()
    })
  })
  it('Search not found', function (done) {
    const app = workerModule.__get__('app')
    const index = [
      {
        'file': 'test 1',
        'content': 'never found',
        'tags': []
      }
    ]
    workerModule.__set__('index', index)

    const server = app.listen()
    const runTest = function (callback) {
      request(server).get('/search?query=always').expect(200, function (error, response) {
        if (error) {
          throw error
        }
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
      if (error) {
        throw error
      }
      done()
    })
  })
  it('Search found', function (done) {
    const app = workerModule.__get__('app')
    const index = [
      {
        'file': 'test 1',
        'content': 'The context of this bean\nNot this line though.',
        'tags': []
      },
      {
        'file': 'test 2',
        'content': 'this baen.',
        'tags': []
      }
    ]
    workerModule.__set__('index', index)

    const server = app.listen()

    const testFull = function (callback) {
      request(server).get('/search?query=a').expect(200, function (error, response) {
        if (error) {
          throw error
        }
        // we care that there were some results, and that it wasn't a
        // partial search.
        assert.include(response.text, '2 results')
        assert.notInclude(response.text, 'not complete')
        callback()
      })
    }
    const testBean = function (callback) {
      request(server).get('/search?query=bean').expect(200, function (error, response) {
        if (error) {
          throw error
        }
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
        if (error) {
          throw error
        }
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
        if (error) {
          throw error
        }
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
      if (error) {
        throw error
      }
      done()
    })
  })
  it('Spelling suggestions', function (done) {
    const app = workerModule.__get__('app')
    const loadDictionary = workerModule.__get__('loadDictionary')
    const index = [
      {
        'file': 'test',
        'content': 'irrelevant',
        'tags': []
      }
    ]
    workerModule.__set__('index', index)
    loadDictionary()
    const testSuggestions = function () {
      const server = app.listen()
      request(server).get('/search?query=hallo').expect(200, function (error, response) {
        if (error) {
          throw error
        }
        // There should have been a spelling correction suggested
        assert.include(response.text, 'hello')
        done()
      })
    }
    const waitForSpell = function () {
      const spell = workerModule.__get__('spell')
      if (spell) {
        testSuggestions()
        return
      }
      setTimeout(waitForSpell, 10)
    }
    waitForSpell()
  })
})
describe('tags', function () {
  it('Schema', function () {
    const validtags = tagsModule.__get__('validTags')
    // Some valid options
    let t = {
      'tags': ['vegan', 'gout']
    }
    assert.isTrue(validtags(t))
    t = {
      'tags': []
    }
    // Incorrect data
    t = {
      'diet': [],
      'cuisine': [4],
      'type': 'recipe'
    }
    assert.isFalse(validtags(t))

    t = {
      'tags': [1]
    }
    assert.isFalse(validtags(t))

    t = {
      'tags': 'vegan'
    }
    assert.isFalse(validtags(t))
    assert.isFalse(validtags(undefined))
  })
  it('Reading Sync', function () {
    const readTagsSync = tagsModule.__get__('readTagsSync')
    const t = readTagsSync('test_data/generic/test.html')
    const recipeTags = t['tags']
    assert.strictEqual(recipeTags.length, 5)
    assert.isTrue(recipeTags.includes('gout'))
    assert.isTrue(recipeTags.includes('vegan'))
    assert.isTrue(recipeTags.includes('FODMAP'))
    assert.isTrue(recipeTags.includes('fusion'))
    assert.isTrue(recipeTags.includes('italian'))
  })
  it('Reading', function (done) {
    const readTags = tagsModule.__get__('readTags')
    readTags('test_data/generic/test.html', function (allTags) {
      const tags = allTags.tags
      assert.strictEqual(tags.length, 5)
      assert.isTrue(tags.includes('gout'))
      assert.isTrue(tags.includes('vegan'))
      assert.isTrue(tags.includes('FODMAP'))
      assert.isTrue(tags.includes('fusion'))
      assert.isTrue(tags.includes('italian'))
      done()
    })
  })
})
