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
const rewire = require('rewire')

const utils = require('./utils')
const buildCache = require('./build-cache')
const metadata = require('./metadata')

const metadataModule = rewire('./metadata.js')
const newRecipeModule = rewire('./new_recipe.js')

// Turn off application logging
winston.level = 'silent'

console.log('Running Integration Tests')

const isTextRecipe = function (path) {
  return path.endsWith('.html') || path.endsWith('.md')
}

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

const foreachRecipeSync = function (predicate) {
  const paths = walkSync('public/recipes')
  paths.forEach(function (path) {
    if (utils.isRecipe(path)) {
      predicate(path)
    }
  })
}

describe('Cache', function () {
  // This can be pretty long running, especially if the files aren't in the disk cache. 1 minute should be more than enough.
  this.timeout(60000)
  it('Up to date', function (done) {
    let paths = []
    foreachRecipeSync(function (path) {
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
        const recipeExtensions = ['.pdf', '.html', '.jpg', '.png', '.md']
        let exists = false
        for (let i = 0; i < recipeExtensions.length; ++i) {
          const recipe = utils.changeExtension(path, recipeExtensions[i])
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
})
describe('Recipes', function () {
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
      if (isTextRecipe(path)) {
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
  it('Ensure degrees', function (done) {
    // This ensures that in each html recipe, I'm using the degrees symbol by temperatures.
    const paths = walkSync('./public/recipes')
    // This will check each file twice, but it's not slow

    // The regex excludes %NN as encoded URLs will have %20 as a space
    const noDegreesCelcius = new RegExp('[^%][0-9][0-9]C')
    const test = function (path, callback) {
      if (isTextRecipe(path)) {
        const content = fs.readFileSync(path, 'utf8')
        let matches = content.match(noDegreesCelcius)
        if (matches) console.log(matches)
        assert.isNull(matches, 'A recipe should contain a degrees symbol. file: ' + path)
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
  it('Ensure gram space', function (done) {
    // This ensures that in each html recipe, there aren't spaces surrounding grams
    const paths = walkSync('./public/recipes')
    // This will check each file twice, but it's not slow

    const noGrams = new RegExp(' g ')
    const test = function (path, callback) {
      if (isTextRecipe(path)) {
        const content = fs.readFileSync(path, 'utf8')
        let matches = content.match(noGrams)
        if (matches) console.log(matches)
        assert.isNull(matches, 'A recipe shouldn\'t have floating gram symbols. file: ' + path)
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
  it('Ensure removed boilerplate', function (done) {
    const paths = walkSync('./public/recipes')

    const boilerplate = new RegExp('°C ½ ¼')
    const test = function (path, callback) {
      if (isTextRecipe(path)) {
        const content = fs.readFileSync(path, 'utf8')
        const matches = content.match(boilerplate)
        if (matches) console.log(matches)
        assert.isNull(matches, 'A recipe shouldn\'t still have boilerplate symbols. file: ' + path)
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
  it('Ensure script includes', function (done) {
    // This isn't relevant any more
    done()
    // This ensures that in each html recipe, I'm including strapdown first
    const paths = walkSync('./public/recipes')
    // This will check each file twice, but it's not slow
    const test = function (path, callback) {
      if (isTextRecipe(path) && !path.includes('Purine Levels.html')) {
        const content = fs.readFileSync(path, 'utf8')
        const strapdown = '<script src="/public/resources/strapdown.js"></script>'
        const recipeFormatting = '<script src="/public/resources/recipe-formatting.js"></script>'
        // The html must include these scripts
        assert.include(content, strapdown)
        assert.include(content, recipeFormatting)
        // strapdown must come first
        const strapdownIndex = content.indexOf(strapdown)
        const recipeFormattingIndex = content.indexOf(recipeFormatting)
        assert.isBelow(strapdownIndex, recipeFormattingIndex, 'Strapdown must appear first in recipes')
      }
      callback()
    }
    async.each(paths, test, function (error) {
      assert.isNull(error)
      done()
    })
  })
})
describe('Images', function () {
  it('Referenced', function (done) {
    // This checks that each image in public/images is referenced in a recipe
    fs.readdir('public/images', function (error, images) {
      if (error) {
        throw error
      }
      const paths = walkSync('./public/recipes')
      paths.forEach(function (path) {
        const content = fs.readFileSync(path)
        // Iterate through the images backwards so we can remove elements
        let i = images.length
        while (i--) {
          const image = images[i]
          if (content.includes(image)) {
            images.splice(i, 1)
          }
        }
      })
      if (images.length) {
        console.error(`Images not referenced: ${images}`)
        assert.fail()
      }
      done()
    })
  })
})
describe('Metadata', function () {
  const metadataPath = metadataModule.__get__('metadataPath')
  const validMetadata = metadataModule.__get__('validMetadata')
  it('Present', function () {
    foreachRecipeSync(function (recipePath) {
      const path = metadataPath(recipePath)
      assert.isTrue(fs.existsSync(path))
    })
  })
  it('Correct', function () {
    foreachRecipeSync(function (recipePath) {
      const t = metadata.readMetadataSync(recipePath)
      assert.isTrue(validMetadata(t), 'Invalid metadata for: ' + recipePath)
      // Ensure that the tags are lower case
      t.tags.forEach(tag => {
        assert.strictEqual(tag, tag.toLowerCase())
      })
      assert.match(t.date, /^\d{4}-\d{2}-\d{2}/)
    })
  })
})
describe('New Recipe', function () {
  it('Build new recipe', function (done) {
    const newRecipe = newRecipeModule.__get__('newRecipe')
    const recipeFileName = newRecipeModule.__get__('recipeFileName')
    const name = 'This is a new recipe'
    const fileName = recipeFileName(name)
    newRecipe(name, '.', function (error) {
      assert.isNull(error)
      fs.readFile(fileName, function (error, buffer) {
        assert.isNull(error)
        const content = buffer.toString('utf8')

        // The recipe should have the recipe name as a header
        assert.include(content, '# ' + name + ' #')

        // Clean up after the test, then we're done
        fs.unlink(fileName, function (error) {
          assert.isNull(error)
          done()
        })
      })
    })
  })
  it('BBC Good Food Parsing', function (done) {
    fs.readFile('test_data/new_recipe/bbc-good-food-crispy-chilli-beef.html', function (error, data) {
      if (error) {
        throw error
      }
      const parseBbcGoodFoodRecipe = newRecipeModule.__get__('parseBbcGoodFoodRecipe')
      const url = 'www.bbcgoodfood.com/recipes/crispy-chilli-beef'
      parseBbcGoodFoodRecipe(url, data, function (markdown) {
        assert.include(markdown, url)
        const ingredients = [
          '350g thin-cut minute steak, very thinly sliced into strips',
          '3 tbsp cornflour',
          '2 tsp Chinese five-spice powder',
          '100ml vegetable oil',
          '1 red pepper, thinly sliced',
          '1 red chilli, thinly sliced',
          '4 spring onions, sliced, green and white parts separated',
          '2 garlic cloves, crushed',
          'thumb-sized piece ginger, cut into matchsticks',
          '4 tbsp rice wine vinegar or white wine vinegar',
          '1 tbsp soy sauce',
          '2 tbsp sweet chilli sauce',
          '2 tbsp tomato ketchup',
          'cooked noodles, to serve (optional)',
          'prawn crackers, to serve (optional)'
        ]
        for (const ingredient of ingredients) {
          assert.include(markdown, ingredient)
        }
        done()
      }
      )
    })
  })
})
