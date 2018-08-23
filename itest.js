'use strict'
/* global describe, it, after */
const chai = require('chai')
const assert = chai.assert
const fs = require('fs')
const async = require('async')
const md5 = require('md5-file')
const firstline = require('firstline')
const path = require('path')
const winston = require('winston')

const utils = require('./utils')
// const fileList = require('./file-list')
const buildCache = require('./build-cache')

// Turn off application logging
winston.level = 'silent'

console.log('Running Integration Tests')

// I would put this in utils, but I don't want this called in a non-test.
const walkSync = function (dir, paths) {
  if (!paths) paths = []
  fs.readdirSync(dir).forEach(function (file) {
    const fullPath = path.join(dir, file)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      walkSync(fullPath, paths)
    } else {
      paths.push(fullPath)
    }
  })
  return paths
}

describe('Cache', function () {
  it('Up to date', function (done) {
    let paths = []
    utils.foreachRecipe('public/recipes', function (path) {
      paths.push(path)
    })
    const test = function (path, callback) {
      const cache = utils.cachePath(path)
      assert.isOk(
        fs.existsSync(cache),
        'Cache for ' + path + ' doesn\'t exist'
      )
      // Check it has the correct hash
      md5(path, function (error, hash) {
        assert.isNull(error)
        const check = function (line) {
          assert.strictEqual(
            hash,
            line,
            'Hash is incorrect for ' + path
          )
          callback()
        }
        const errorThrow = function (err) {
          throw err
        }
        firstline(cache).then(check, errorThrow)
      })
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
  it('Matching files', function (done) {
    const paths = walkSync('./public/recipes')
    // This will check each file twice, but it's not slow

    const test = function (path, callback) {
      if (path.endsWith('.cache')) {
        // Find out what this cache was made from
        const recipeExtensions = ['.pdf', '.html', '.jpg']
        let exists = false
        for (let i = 0; i < recipeExtensions.length; ++i) {
          const recipe = path.replace(/\..*/, recipeExtensions[i])
          if (fs.existsSync(recipe)) {
            exists = true
          }
        }
        assert.isOk(exists, 'Recipe doesn\'t exist for ' + path)
      } else if (path.endsWith('_metadata.json')) {
        // Don't do anything for meta data
      } else {
        const cache = utils.cachePath(path)
        assert.isOk(fs.existsSync(cache))
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
  after(function () {
    const cache = 'test_data/clear_cache_tree/test_recipe.cache'
    if (fs.existsSync(cache)) {
      fs.unlinkSync(cache)
    }
  })
  it('Don\'t delete cache content', function (done) {
    const html = 'test_data/clear_cache_tree/test_recipe.html'
    const tilda = html + '~'
    const cache = 'test_data/clear_cache_tree/test_recipe.cache'
    // There shouldn't be an existing cache file
    if (fs.existsSync(cache)) {
      fs.unlinkSync(cache)
    }
    // Create the temp file
    if (!fs.existsSync(tilda)) {
      fs.closeSync(fs.openSync(tilda, 'w'))
    }
    const path = 'test_data/clear_cache_tree/'
    // Watch for the single change event we should get
    const watcher = fs.watch(path, function (eventType, filename) {
      if (eventType === 'change') {
        const stats = fs.statSync(path + filename)
        // The hash and the title are 44 bytes, add some wiggle room
        // (The expected value is 128, but I think that'll be a fragile test)
        assert.isAbove(stats.size, 50)
        // Do some cleanup
        watcher.close()
        done()
      }
    })

    buildCache.buildCache('test_data/clear_cache_tree')
  })
  it('Ensure unicode fractions', function (done) {
    // This ensures that in each html recipe, I'm using unicode fractions
    // e.g. ¼, ⅓, ½ rather than 1/4, 1/3, 1/2
    // because it displays better on the site.
    const paths = walkSync('./public/recipes')
    // This will check each file twice, but it's not slow

    // I want to match [0-9]/[0-9] but that matches quite a few URLs
    // so use 2 regexes and match space before and after
    const nonUnicodeFractionSpaceBefore = new RegExp('\\s[0-9]/[0-9]')
    const nonUnicodeFractionSpaceAfter = new RegExp('[0-9]/[0-9]\\s')
    const test = function (path, callback) {
      if (path.endsWith('.html')) {
        const content = fs.readFileSync(path, 'utf8')
        let matches = content.match(nonUnicodeFractionSpaceBefore)
        if (matches) console.log(matches)
        const errorMessage =
          'A recipe contains a non-unicode fraction. file: ' + path
        assert.isNull(matches, errorMessage)
        matches = content.match(nonUnicodeFractionSpaceAfter)
        if (matches) console.log(matches)
        assert.isNull(matches, errorMessage)
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
})
