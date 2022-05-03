'use strict'
const fs = require('graceful-fs')
const jsonschema = require('jsonschema')

const log = require('./log')
const utils = require('./utils')

const SCHEMA = {
  id: '/RecipeMetadata',
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    date: {
      type: 'string' // format YYYY-MM-DD
    },
    image: {
      type: 'string'
    }
  },
  required: ['tags', 'date', 'image']
}

const DEFAULT_METADATA = {
  tags: [],
  date: '',
  image: ''
}

const metadataPath = function (recipePath) {
  return utils.changeExtension(recipePath, '.metadata')
}

const metadataExists = function (recipePath) {
  const filePath = metadataPath(recipePath)
  return fs.existsSync(filePath)
}

const validMetadata = function (metadata) {
  let valid = false
  if (metadata) {
    const validator = new jsonschema.Validator()
    valid = validator.validate(metadata, SCHEMA).valid
  }
  return valid
}

const doReadMetadata = function (content, ignoreErrors) {
  const metadata = JSON.parse(content)
  if (metadata) {
    if (!ignoreErrors) {
      const valid = validMetadata(metadata)
      if (!valid) {
        throw new Error('Invalid metadata')
      }
    }
    metadata.tags.sort()
    return metadata
  }
}

const readMetadataSync = function (recipePath, ignoreErrors) {
  const filePath = metadataPath(recipePath)
  const content = fs.readFileSync(filePath, 'utf8')
  if (content) {
    return doReadMetadata(content, ignoreErrors)
  }
}

const readMetadata = function (recipePath, callback) {
  const filePath = metadataPath(recipePath)
  fs.readFile(filePath, 'utf8', function (error, content) {
    if (error) {
      throw error
    }
    callback(doReadMetadata(content))
  })
}

const writeMetadataSync = function (recipePath, metadata) {
  let success = false
  if (validMetadata(metadata)) {
    const filePath = metadataPath(recipePath)
    const data = JSON.stringify(metadata)
    fs.writeFileSync(filePath, data, 'utf8')
    log.debug('Metadata written for ' + filePath)
    success = true
  } else {
    log.error('Metadata is invalid: ' + JSON.stringify(metadata))
  }
  return success
}

const initialiseMetadata = function (recipePath) {
  writeMetadataSync(recipePath, DEFAULT_METADATA)
}

module.exports.readMetadataSync = readMetadataSync
module.exports.writeMetadataSync = writeMetadataSync
module.exports.metadataExists = metadataExists
module.exports.initialiseMetadata = initialiseMetadata
module.exports.readMetadata = readMetadata
