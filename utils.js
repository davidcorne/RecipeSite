"use strict"; 

const path = require('path');

//=============================================================================
const pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

module.exports.pathToLabel = pathToLabel;
