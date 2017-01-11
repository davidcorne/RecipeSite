"use strict"; 
const fs = require('fs');
const path = require('path');

const utils = require('./utils');

//=============================================================================
const walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

//=============================================================================
const searchText = function(query, file, results) {
    const contents = fs.readFileSync(file, 'utf8').toLowerCase();
    if (contents.indexOf(query) > -1) {
        // make the context. Each line where the query appears.
        const lines = contents.split(/\r?\n/);
        const context = [];
        for (let i = 0; i < lines.length; ++i) {
            if (lines[i].indexOf(query) > -1) {
                context.push(lines[i]);
            }
        }
        results.push({
            label: utils.pathToLabel(file),
            path: file,
            context: context
        });
    }
}

//=============================================================================
const search = function(query) {
    query = query.toLowerCase();
    const files = [];
    walkSync('public/recipes', files);
    const results = [];
    for (let i = 0; i < files.length; ++i) {
        const file = files[i];
        if (path.extname(file) === '.html') {
            searchText(query, file, results);
        } else if (path.extname(file) === '.pdf') {
            
        }
    }
    return results;
};

module.exports.search = search;
