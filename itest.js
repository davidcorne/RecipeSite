'use strict'
/* global describe, it */
const chai = require('chai')
const assert = chai.assert
const fs = require('fs')
const async = require('async')
const md5 = require('md5-file')
const firstline = require('firstline')
const path = require('path')

const utils = require('./utils')
const fileList = require('./file-list')

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
    const recursor = function (directory) {
      directory.files.forEach(function (file) {
        paths.push(file.path)
      })
      directory.directories.forEach(recursor)
    }
    const directories = fileList.generateFileList()
    directories.forEach(recursor)
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
