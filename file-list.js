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
            const extension = path.extname(pth)
            if (extension === '.pdf') {
                // 
                item.files.push({
                    path: pth.replace('.pdf', '.pdfembed'),
                    label: utils.pathToLabel(pth)
                });
            } else if (extension !== '.cache') {
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
    const files = [
        'public/recipes/Breakfast',
        'public/recipes/Snack',
        'public/recipes/Mains',
        'public/recipes/Dessert'
    ]
    files.forEach(function(file) {
        fileList.push(directoryToItem(file));
    });
    return fileList;
}

module.exports.generateFileList = generateFileList;
