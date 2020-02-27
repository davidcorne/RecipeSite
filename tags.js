'use strict'
const fs = require('graceful-fs')
const jsonschema = require('jsonschema')

const log = require('./log')
const utils = require('./utils')

const schema = {
  'id': '/Recipetags',
  'type': 'object',
  'properties': {
    'tags': {
      'type': 'array',
      'items': {'type': 'string'}
    },
    'date': {
      'type': 'string' // format YYY-MM-DD
    }
  },
  'required': ['tags', 'date']
}

const defaultTags = {
  'tags': [],
  'date': ''
}

const tagsPath = function (recipePath) {
  return utils.changeExtension(recipePath, '.tags')
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
    if (!valid) {
      throw new Error('Invalid tags')
    } else {
      tags.tags.sort()
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
  const tag = defaultTags
  const date = new Date()
  tag['date'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay()
  writeTagsSync(recipePath, tag)
}

module.exports.readTagsSync = readTagsSync
module.exports.writeTagsSync = writeTagsSync
module.exports.tagsExists = tagsExists
module.exports.initialiseTags = initialiseTags
module.exports.readTags = readTags
