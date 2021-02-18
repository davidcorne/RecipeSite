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

const utils = require('./utils')

const utilsModule = rewire('./utils.js')
const searchModule = rewire('./search.js')
const buildCacheModule = rewire('./build-cache.js')
const workerModule = rewire('./worker.js')
const metadataModule = rewire('./metadata.js')
const fileListModule = rewire('./file-list.js')
const newRecipeModule = rewire('./new_recipe.js')
const urlParserModule = rewire('./url-parser.js')

console.log('Running Unit Tests')

describe('Utils', function () {
  it('Remove diacritic', function () {
    const testCases = [
      ['café', 'cafe'],
      ['brulée', 'brulee'],
      ['schön', 'schon']
    ]
    testCases.forEach((testCase) => {
      const result = utils.removeDiacritic(testCase[0])
      assert.strictEqual(result, testCase[1])
    })
  })
  it('Format date', function () {
    // Note: for JS dates, months are indexed from 0
    const testCases = [
      [new Date(2015, 11, 28), '2015-12-28'],
      [new Date(2020, 1, 1), '2020-02-01']
    ]
    testCases.forEach((testCase) => {
      const result = utils.formatDate(testCase[0])
      assert.strictEqual(result, testCase[1])
    })
  })
  it('Image from item', function () {
    const imageFromRecipe = utilsModule.__get__('imageFromRecipe')
    // test that it gets an image from the 1st, but not the second
    const contentWithImage = `
  This is a Masterchef AU recipe by Matt Abe.
  ![Roast Chicken, Summer Vegetables and Green Herb Consommé](/public/images/Roast-Chicken-Summer-Vegetables-and-Green-Herb-Consommé.jpg)
`
    assert.strictEqual(imageFromRecipe(contentWithImage), '/public/images/Roast-Chicken-Summer-Vegetables-and-Green-Herb-Consommé.jpg')
    const contentWithoutImage = `
  This is a Masterchef AU recipe by Matt Abe.
  [Roast Chicken, Summer Vegetables and Green Herb Consommé](/public/images/Roast-Chicken-Summer-Vegetables-and-Green-Herb-Consommé.jpg)
`
    assert.strictEqual(imageFromRecipe(contentWithoutImage), '')
  })
  it('Title case', function () {
    const testCases = [
      ['hello there', 'Hello There']
    ]
    testCases.forEach((testCase) => {
      const result = utils.titleCase(testCase[0])
      assert.strictEqual(result, testCase[1])
    })
  })
  it('Domain name', function () {
    const a = 'www.example.com/search?test=true'
    assert.strictEqual('example.com', utils.domainName(a))
    const b = 'www.bbcgoodfood.com/recipes/crispy-chilli-beef'
    assert.strictEqual('bbcgoodfood.com', utils.domainName(b))
  })
})
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
  const testHTMLCacheWriting = function (path, includedStrings, callback) {
    cacheFile(path, function () {
      const cache = utils.cachePath(path)
      assert.isOk(fs.existsSync(cache))
      fs.readFile(cache, 'utf8', function (error, content) {
        if (error) {
          throw error
        }
        includedStrings.forEach((string) => {
          assert.include(content, string)
        })
        fs.unlink(cache, function (error) {
          if (error) {
            throw error
          }
          callback()
        })
      })
    })
  }
  it('Html cache writing', function (done) {
    testHTMLCacheWriting(
      'test_data/generic/test_recipe.html',
      ['912dc7447439d9bff54b1002b538db24'],
      done
    )
  })
  it('PDF cache writing', function (done) {
    testPDFCacheWriting(done)
  })
  it('Don\'t delete cache content', function () {
    // fs.unlinkSync('test_data/clear_cache_tree/test_recipe.cache')
  })
  it('CachePath', function () {
    const one = utils.cachePath('one.pdf')
    assert.strictEqual(one, 'one.cache')
    const two = utils.cachePath('two')
    assert.strictEqual(two, 'two.cache')
    const three = utils.cachePath('three.etc.jpg')
    assert.strictEqual(three, 'three.etc.cache')
  })
  it('Cache diacritics', function (done) {
    testHTMLCacheWriting(
      'test_data/generic/test_recipe_diacritics.html',
      ['This is a funky String'],
      done
    )
  })
})

describe('Search', function () {
  assert.searchResultEqual = function (result, expected) {
    assert.strictEqual(result.label, expected.label)
    assert.strictEqual(result.path, expected.path)
    assert.strictEqual(result.displayPath, expected.displayPath)
    assert.strictEqual(result.context.length, expected.context.length)
    for (let i = 0; i < expected.context.length; ++i) {
      assert.strictEqual(result.context[i], expected.context[i])
    }
  }
  it('Search', function () {
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
        context: ['This is FOUND, but more found!']
      },
      {
        label: 'c',
        path: path.join('A', 'B', 'c.path'),
        displayPath: 'A/B/c',
        context: ['This is found']
      }
    ]
    assert.strictEqual(results.length, 2)
    assert.searchResultEqual(results[0], expected[0])
    assert.searchResultEqual(results[1], expected[1])
  })
  it('Read cache', function (done) {
    const readCacheFile = searchModule.__get__('readCacheFile')
    readCacheFile('test_data/generic/test_cache.html', function (content) {
      assert.notInclude(content, 'fbdc7648558d2e55237f92296d61958f')
      assert.include(content, '# BBQ Marinade')
      done()
    })
  })
  it('Title weight', function () {
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
  it('Tags weight', function () {
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
  it('Tags partial match', function () {
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
  it('Build index', function (done) {
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
      workerModule.__set__('INDEX', index)
      const searchIndex = workerModule.__get__('searchIndex')

      let data = {'query': 'nothing', 'page': 1}
      searchIndex(data)
      assert.isNotNull(data.key)
      assert.isNotNull(data.suggestions)
      assert.isNotNull(data.results)
      assert.isNotNull(data.time)

      // There won't actually be a spelling module set up
      assert.strictEqual(data.suggestions.length, 0)
      assert.strictEqual(data.results.length, 1)
      assert.strictEqual(data.results[0].label, '1')
      assert.strictEqual(data.results[0].context.length, 1)
      assert.strictEqual(data.results[0].context[0], 'Nothing')
    } finally {
      // Reset what we've changed
      workerModule.__set__('INDEX', [])
    }
  })
  it('Multiple terms', function () {
    const search = searchModule.__get__('search')
    const index = []
    index.push({
      'file': 'one',
      'content': 'lorum keyword ipsum\nother other stuff',
      'tags': []
    })
    index.push({
      'file': 'two',
      'content': 'keyword other\nlorum ipsum',
      'tags': []
    })
    index.push({
      'file': 'three',
      'content': 'keyword',
      'tags': []
    })
    index.push({
      'file': 'four',
      'content': 'No match here',
      'tags': []
    })
    const results = search('keyword other', index)
    assert.strictEqual(results.length, 3)
    // Should rank finding the whole phrase higher than finding it separated. It should rank finding only some of the words lowest.
    assert.strictEqual(results[0].label, 'two')
    assert.strictEqual(results[1].label, 'one')
    assert.strictEqual(results[2].label, 'three')
  })
  it('Multiple terms all used', function () {
    // This tests that if you search using multiple terms, it ranks results which has
    // all of the terms present higher.
    const search = searchModule.__get__('search')
    const index = []
    index.push({
      'file': 'one',
      'content': 'aa cc',
      'tags': []
    })
    index.push({
      'file': 'two',
      'content': 'bb bb bb cc',
      'tags': []
    })
    index.push({
      'file': 'three',
      'content': 'bb aa cc',
      'tags': []
    })
    const results = search('aa bb', index)
    assert.strictEqual(results.length, 3)
    assert.strictEqual(results[0].label, 'three')
    assert.strictEqual(results[1].label, 'two')
    assert.strictEqual(results[2].label, 'one')
  })
  it('Trailing and leading space', function () {
    // This tests that if you search something with a trailing or leading space, it will return sensible results
    const search = searchModule.__get__('search')
    const index = []
    index.push({
      'file': 'one',
      'content': 'There is no sensible result here',
      'tags': []
    })
    index.push({
      'file': 'two',
      'content': 'More random strings',
      'tags': []
    })
    {
      // Trailing
      const results = search('Not found ', index)
      assert.strictEqual(results.length, 0)
    }
    {
      // Leading
      const results = search(' Not found', index)
      assert.strictEqual(results.length, 0)
    }
    {
      // Both
      const results = search(' Not found ', index)
      assert.strictEqual(results.length, 0)
    }
    {
      // An actual result
      const results = search(' More random ', index)
      assert.strictEqual(results.length, 1)
    }
  })
  it('Diacritics in content', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': 'one',
        'content': 'This is an original creme brulee',
        'tags': []
      }
    ]
    {
      // Ensure we're trimming diacritics out of search terms, so it matches the asciish index we have.
      const results = search('crème brûlée', index)
      assert.strictEqual(results.length, 1)
    }
  })
  it('Diacritics in file name', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': 'Gruyère Chips',
        'content': 'These are some chips made of cheese!',
        'tags': []
      }
    ]
    {
      // Ensure that if we search for Gruyere, we find the recipe with Gruyère in the title.
      const results = search('gruyere', index)
      assert.strictEqual(results.length, 1)
    }
    index.push({
      'file': 'Other Cheese',
      'content': 'This recipe contains Gruyere',
      'tags': []
    })
    {
      // Ensure that the title is weighted correctly.
      const results = search('gruyere', index)
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0].label, 'Gruyère Chips')
      assert.strictEqual(results[1].label, 'Other Cheese')
    }
  })
  it('Whole word matching', function () {
    const search = searchModule.__get__('search')
    const index = [
      {
        'file': '1',
        'content': 'Maximum maximum',
        'tags': []
      },
      {
        'file': '2',
        'content': 'mum',
        'tags': []
      }
    ]

    const results = search('mum', index)
    assert.strictEqual(results.length, 2)
    // Should rank 1 instance of mum, higher than 2 of maximum
    assert.strictEqual(results[0].label, '2')
    assert.strictEqual(results[1].label, '1')
  })
})

describe('Routing', function () {
  this.afterEach(function () {
    workerModule.__set__('INDEX', [])
  })

  it('Existing', function (done) {
    const app = workerModule.__get__('APP')
    const server = app.listen()

    // Responds to all the routes.
    const testRoute = function (route, callback) {
      request(server).get(route).expect(200, callback)
    }
    async.each([
      '/',
      '/public/resources/index.css',
      '/search',
      '/images'
    ], testRoute, function (error) {
      if (error) {
        throw error
      }
      server.close(done)
    })
  })
  it('Redirecting', function (done) {
    const app = workerModule.__get__('APP')
    const server = app.listen()

    // Responds to all the routes.
    const testRoute = function (route, callback) {
      request(server).get(route).expect(302, callback)
    }
    async.each([
      '/influences'
    ], testRoute, function (error) {
      if (error) {
        throw error
      }
      server.close(done)
    })
  })
  it('Non-existing', function (done) {
    // Try to get some non-existent routes
    const app = workerModule.__get__('APP')
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
    const app = workerModule.__get__('APP')
    const server = app.listen()
    request(server).get('/search?query=bean').expect(200, function (error, response) {
      if (error) {
        throw error
      }
      assert.include(response.text, 'Search results are not ready yet.')
      assert.include(response.text, 'public/resources/page-not-ready.js')
      done()
    })
  })
  it('Search not found', function (done) {
    const app = workerModule.__get__('APP')
    const index = [
      {
        'file': 'test 1',
        'content': 'never found',
        'tags': []
      }
    ]
    workerModule.__set__('INDEX', index)

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
      }
    ], function (error) {
      if (error) {
        throw error
      }
      done()
    })
  })
  it('Search found', function (done) {
    const app = workerModule.__get__('APP')
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
    workerModule.__set__('INDEX', index)

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
    async.series([
      testFull,
      testBean,
      testThis
    ], function (error) {
      if (error) {
        throw error
      }
      done()
    })
  })
  it('Spelling suggestions', function (done) {
    const app = workerModule.__get__('APP')
    const loadDictionary = workerModule.__get__('loadDictionary')
    const index = [
      {
        'file': 'test',
        'content': 'irrelevant',
        'tags': []
      }
    ]
    workerModule.__set__('INDEX', index)
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
      const spell = workerModule.__get__('SPELL')
      if (spell) {
        testSuggestions()
        return
      }
      setTimeout(waitForSpell, 10)
    }
    waitForSpell()
  })
  it('Malformed search', function (done) {
    const app = workerModule.__get__('APP')
    const loadDictionary = workerModule.__get__('loadDictionary')
    const index = [
      {
        'file': 'A',
        'content': 'Some content',
        'tags': []
      },
      {
        'file': 'B',
        'content': 'Some more content',
        'tags': []
      }
    ]
    workerModule.__set__('INDEX', index)
    loadDictionary()
    const testSuggestions = function () {
      const server = app.listen()
      request(server).get('/search?query=Brownie+').expect(200, function (error, response) {
        if (error) {
          throw error
        }
        // We expect to not get any search results back
        assert.include(response.text, '0 results')
        done()
      })
    }
    const waitForSpell = function () {
      const spell = workerModule.__get__('SPELL')
      if (spell) {
        testSuggestions()
        return
      }
      setTimeout(waitForSpell, 10)
    }
    waitForSpell()
  })
  it('New page', function (done) {
    const app = workerModule.__get__('APP')
    const server = app.listen()
    // Use guids so it will be unambiguous the recipe order
    const firstRecipe = '7dbd878d-3f5e-4401-86bf-536fa3d06b99'
    const secondRecipe = 'c2c88cf5-91b7-415a-a6cf-b66948f1f1cd'
    const thirdRecipe = 'a6533d2b-4733-4f86-9225-e7c84eac06f5'
    const index = [
      {
        'file': thirdRecipe,
        'content': 'Some content',
        'tags': [],
        'date': 1
      },
      {
        'file': secondRecipe,
        'content': 'Some more content',
        'tags': [],
        'date': 2
      },
      {
        'file': firstRecipe,
        'content': 'Even more content!',
        'tags': [],
        'date': 3
      }
    ]
    workerModule.__set__('INDEX', index)
    request(server).get('/new').expect(200, function (error, response) {
      if (error) {
        throw error
      }
      // Get the indicies of the recipes, then ensure they are in the response and in the right order
      const firstRecipeIndex = response.text.indexOf(firstRecipe)
      const secondRecipeIndex = response.text.indexOf(secondRecipe)
      const thirdRecipeIndex = response.text.indexOf(thirdRecipe)
      assert.notStrictEqual(firstRecipeIndex, -1)
      assert.notStrictEqual(secondRecipeIndex, -1)
      assert.notStrictEqual(thirdRecipeIndex, -1)
      assert.isBelow(firstRecipeIndex, secondRecipeIndex)
      assert.isBelow(secondRecipeIndex, thirdRecipeIndex)
      done()
    })
  })
  it('New not ready', function (done) {
    const app = workerModule.__get__('APP')
    const server = app.listen()
    request(server).get('/new').expect(200, function (error, response) {
      if (error) {
        throw error
      }
      assert.include(response.text, 'New recipes are not ready yet. This page will update when they are.')
      assert.include(response.text, 'public/resources/page-not-ready.js')
      done()
    })
  })
})
describe('Metadata', function () {
  it('Schema', function () {
    const validMetadata = metadataModule.__get__('validMetadata')
    // Some valid options
    let t = {
      'tags': ['vegan', 'gout'],
      'date': 'a date',
      'image': 'an image'
    }
    assert.isTrue(validMetadata(t))
    t = {
      'tags': [],
      'date': 'a date'
    }
    // Incorrect data
    t = {
      'diet': [],
      'cuisine': [4],
      'type': 'recipe'
    }
    assert.isFalse(validMetadata(t))

    t = {
      'tags': [1]
    }
    assert.isFalse(validMetadata(t))

    t = {
      'tags': 'vegan'
    }
    assert.isFalse(validMetadata(t))
    assert.isFalse(validMetadata(undefined))
  })
  it('Reading sync', function () {
    const readMetadataSync = metadataModule.__get__('readMetadataSync')
    const t = readMetadataSync('test_data/generic/test.html')
    const recipeTags = t['tags']
    assert.strictEqual(recipeTags.length, 5)
    assert.isTrue(recipeTags.includes('gout'))
    assert.isTrue(recipeTags.includes('vegan'))
    assert.isTrue(recipeTags.includes('FODMAP'))
    assert.isTrue(recipeTags.includes('fusion'))
    assert.isTrue(recipeTags.includes('italian'))
    assert.strictEqual(t['date'], 'someday')
  })
  it('Reading', function (done) {
    const readMetadata = metadataModule.__get__('readMetadata')
    readMetadata('test_data/generic/test.html', function (allTags) {
      const tags = allTags.tags
      assert.strictEqual(tags.length, 5)
      assert.isTrue(tags.includes('gout'))
      assert.isTrue(tags.includes('vegan'))
      assert.isTrue(tags.includes('FODMAP'))
      assert.isTrue(tags.includes('fusion'))
      assert.isTrue(tags.includes('italian'))
      assert.strictEqual(allTags['date'], 'someday')
      done()
    })
  })
  it('Metadata file name', function () {
    const metadataPath = metadataModule.__get__('metadataPath')
    const one = metadataPath('one.pdf')
    assert.strictEqual(one, 'one.metadata')
    const two = metadataPath('two')
    assert.strictEqual(two, 'two.metadata')
    const three = metadataPath('three.etc.jpg')
    assert.strictEqual(three, 'three.etc.metadata')
  })
})
describe('New Recipe', function () {
  const recipeFileName = newRecipeModule.__get__('recipeFileName')
  it('Recipe file name', function () {
    assert.strictEqual('hi.md', recipeFileName('hi'))
  })
})
describe('Parser', function () {
  const BbcGoodFoodParser = urlParserModule.__get__('BbcGoodFoodParser')
  const parserFactory = urlParserModule.__get__('parserFactory')
  const markdownTemplate = urlParserModule.__get__('markdownTemplate')
  it('BBC Good Food Title', function () {
    const parser = new BbcGoodFoodParser()
    const title = parser.parseTitle('www.bbcgoodfood.com/recipes/crispy-chilli-beef')
    assert.strictEqual(title, 'Crispy Chilli Beef')
  })
  it('Markdown template', function () {
    const md = markdownTemplate(
      'A Title',
      'some alt text',
      'www.recipe-site.gov',
      ['1 tsp rubbish', 'a thumb sized piece of ginger'],
      ['Add all the ingredients, make a well in the middle', 'mix well', 'serve with rice']
    )
    assert.include(md, '# A Title #')
    assert.include(md, '[some alt text](www.recipe-site.gov)')
    assert.include(md, '- 1 tsp rubbish')
    assert.include(md, '- a thumb sized piece of ginger')
    assert.include(md, '1. Add all the ingredients, make a well in the middle')
    assert.include(md, '1. serve with rice')
    // Ensure that the lists start the line, no leading spaces.
    const ulStartLine = /\n- /g
    // Should have two bullet points starting lines
    assert.strictEqual(2, md.match(ulStartLine).length)
    const olStartLine = /\n1. /g
    // Should have three ordered list items
    assert.strictEqual(3, md.match(olStartLine).length)
  })
  it('Parser factory', function () {
    const parser = parserFactory('www.bbcgoodfood.com/')
    assert.strictEqual('BbcGoodFoodParser', parser.constructor.name)
  })
})
describe('File List', function () {
  it('directoryToItem', function () {
    const directoryToItem = fileListModule.__get__('directoryToItem')
    const item = directoryToItem('test_data', 'generic/')
    // Should have test_recipe.html, test_recipe.pdf and test_recipe_diacritics.html
    assert.strictEqual(item.files.length, 3)
  })
  it('filterNewRecipes', function () {
    const filterNewRecipes = fileListModule.__get__('filterNewRecipes')
    const index = []
    index.push({
      'file': '2',
      'content': '2',
      'date': '2'
    })
    index.push({
      'file': '4',
      'content': '4',
      'date': '4'
    })
    index.push({
      'file': '3',
      'content': '3',
      'date': '3'
    })
    index.push({
      'file': '1',
      'content': '1',
      'date': '1'
    })
    const orderedRecipes = filterNewRecipes(index)
    assert.strictEqual(orderedRecipes.length, 4)
    // Should be largest 'date' first
    assert.strictEqual(orderedRecipes[0].path, '4')
    assert.strictEqual(orderedRecipes[1].path, '3')
    assert.strictEqual(orderedRecipes[2].path, '2')
    assert.strictEqual(orderedRecipes[3].path, '1')
  })
  it('Stable sort', function () {
    const filterNewRecipes = fileListModule.__get__('filterNewRecipes')
    const index = []
    index.push({
      'file': '2',
      'content': '2',
      'date': '2'
    })
    index.push({
      'file': '4',
      'content': '4',
      'date': '2'
    })
    index.push({
      'file': '3',
      'content': '3',
      'date': '2'
    })
    // This should sort by date, then by name
    for (let i = 0; i < 100; ++i) {
      const orderedRecipes = filterNewRecipes(index)
      assert.strictEqual(orderedRecipes.length, 3)
      // Should be largest file first
      assert.strictEqual(orderedRecipes[0].path, '2')
      assert.strictEqual(orderedRecipes[1].path, '3')
      assert.strictEqual(orderedRecipes[2].path, '4')
    }
  })
})
