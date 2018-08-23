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
  const validator = new jsonschema.Validator()
  return validator.validate(metadata, schema).valid
}

const metadataPath = function (recipePath) {
  return recipePath.replace(/\..*/, '_metadata.json')
}

const metadata = function (recipePath) {

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

module.exports.metadata = metadata
module.exports.writeMetadataSync = writeMetadataSync
