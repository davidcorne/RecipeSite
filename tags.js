'use strict'
const fs = require('graceful-fs')
const jsonschema = require('jsonschema')

const log = require('./log')

const schema = {
  'id': '/Recipetags',
  'type': 'object',
  'properties': {
    'tags': {
      'type': 'array',
      'items': {'type': 'string'}
    }
  },
  'required': ['tags']
}

const defaultTags = {
  'tags': []
}

const tagsPath = function (recipePath) {
  return recipePath.replace(/\..*/, '.tags')
}

const tagsExists = function (recipePath) {
  const filePath = tagsPath(recipePath)
  return fs.existsSync(filePath)
}

const validTags = function (tags) {
  let valid = false
  if (tags) {
    const validator = new jsonschema.Validator()
    valid = validator.validate(tags, schema).valid
  }
  return valid
}

const doReadTags = function (content) {
  const tags = JSON.parse(content)
  if (tags) {
    const valid = validTags(tags)
    if (valid) {
      return tags
    }
  }
}

const readTagsSync = function (recipePath) {
  const filePath = tagsPath(recipePath)
  const content = fs.readFileSync(filePath, 'utf8')
  if (content) {
    return doReadTags(content)
  }
}

const readTags = function (recipePath, callback) {
  const filePath = tagsPath(recipePath)
  fs.readFile(filePath, 'utf8', function (error, content) {
    if (error) {
      throw error
    }
    callback(doReadTags(content))
  })
}

const writeTagsSync = function (recipePath, tags) {
  let success = false
  if (validTags(tags)) {
    const filePath = tagsPath(recipePath)
    const data = JSON.stringify(tags)
    fs.writeFileSync(filePath, data, 'utf8')
    log.info('Tags written for ' + filePath)
    success = true
  } else {
    log.error('Tags is invalid: ' + JSON.stringify(tags))
  }
  return success
}

const initialiseTags = function (recipePath) {
  writeTagsSync(recipePath, defaultTags)
}

module.exports.readTagsSync = readTagsSync
module.exports.writeTagsSync = writeTagsSync
module.exports.tagsExists = tagsExists
module.exports.initialiseTags = initialiseTags
module.exports.readTags = readTags
