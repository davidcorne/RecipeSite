'use strict';
const fs = require('graceful-fs');
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
                if (pth.substr(pth.length - 1) !== '~') {
                    item.files.push({
                        path: pth,
                        label: utils.pathToLabel(pth)
                    });
                }
            }
        }
    });
    return item;
};

//=============================================================================
const generateFileList = function() {
    const fileList = [];
    const files = [
        'public/recipes/Breakfast',
        'public/recipes/Snack',
        'public/recipes/Mains',
        'public/recipes/Dessert',
        'public/recipes/Other'
    ]
    files.forEach(function(file) {
        fileList.push(directoryToItem(file));
    });
    return fileList;
}

module.exports.generateFileList = generateFileList;
