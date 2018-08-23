'use strict'
const fs = require('graceful-fs')

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
  return false
}

const metadataPath = function (recipePath) {
  return recipePath.replace(/\..*/, '_metadata.json')
}

const metadata = function (recipePath) {

}

const writeMetadataSync = function (recipePath, metadata) {
  const filePath = metadataPath(recipePath)
  const data = JSON.stringify(metadata)
  fs.writeFileSync(filePath, data, 'utf8')
}

module.exports.metadata = metadata
module.exports.writeMetadataSync = writeMetadataSync
