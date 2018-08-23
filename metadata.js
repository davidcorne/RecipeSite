'use strict'
const fs = require('graceful-fs')
// const path = require('path')
// const PDFParser = require('pdf2json')
// const jsdom = require('jsdom')
// const md5 = require('md5-file')
// const firstline = require('firstline')

// const utils = require('./utils')

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
