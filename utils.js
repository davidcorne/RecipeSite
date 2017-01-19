'use strict'; 

const path = require('path');

//=============================================================================
const pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

//=============================================================================
const cachePath = function(file) {
    return file.replace(/\..*/, '.cache');
}

module.exports.pathToLabel = pathToLabel;
module.exports.cachePath = cachePath;
