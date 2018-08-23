'use strict'
const fs = require('graceful-fs')
const jsonschema = require('jsonschema')

const log = require('./log')

const schema = {
  'id': '/RecipeMetadata',
  'type': 'object',
  'properties': {
    'diet': {
      'type': 'array',
      'items': {'type': 'string'}
    },
    'cuisine': {
      'type': 'array',
      'items': {'type': 'string'}
    },
    'type': {
      'type': 'string',
      'enum': ['recipe', 'manual', 'chart']
    }
  },
  'required': ['diet', 'cuisine', 'type']
}

const validMetadata = function (metadata) {
  let valid = false
  if (metadata) {
    const validator = new jsonschema.Validator()
    valid = validator.validate(metadata, schema).valid
  }
  return valid
}

const metadataPath = function (recipePath) {
  return recipePath.replace(/\..*/, '_metadata.json')
}

const readMetadataSync = function (recipePath) {
  const filePath = metadataPath(recipePath)
  const content = fs.readFileSync(filePath, 'utf8')
  if (content) {
    const metadata = JSON.parse(content)
    if (metadata) {
      const valid = validMetadata(metadata)
      if (valid) {
        return metadata
      }
    }
  }
}

const writeMetadataSync = function (recipePath, metadata) {
  let success = false
  if (validMetadata(metadata)) {
    const filePath = metadataPath(recipePath)
    const data = JSON.stringify(metadata)
    fs.writeFileSync(filePath, data, 'utf8')
    log.info('Metadata written for ' + filePath)
    success = true
  } else {
    log.error('Metadata is invalid: ' + JSON.stringify(metadata))
  }
  return success
}

module.exports.readMetadataSync = readMetadataSync
module.exports.writeMetadataSync = writeMetadataSync
