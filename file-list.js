"use strict"; 
const fs = require('fs');
const path = require('path');

const utils = require('./utils');

//=============================================================================
const directoryToItem = function(dir) {
    const item = {
        label: path.basename(dir),
        files: [],
        directories: []
    };
    const files = fs.readdirSync(dir);
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            item.directories.push(directoryToItem(path.join(dir, file)));
        } else {
            const pth = path.join(dir, file);
            if (path.extname(pth) !== '.cache') {
                item.files.push({
                    path: pth,
                    label: utils.pathToLabel(pth)
                });
            }
        }
    });
    return item;
};

//=============================================================================
const generateFileList = function() {
    const fileList = [];
    const root = 'public/recipes';
    const files = fs.readdirSync(root);
    files.forEach(function(file) {
        fileList.push(directoryToItem(path.join(root, file)));
    });
    return fileList;
}

module.exports.generateFileList = generateFileList;
