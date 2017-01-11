"use strict"; 
const fs = require('fs');
const path = require('path');

const utils = require('./utils');

const index = [];

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
const search = function(query) {
    query = query.toLowerCase();
    const results = [];
    index.forEach(function(item) {
        if (item.content.indexOf(query) > -1) {
            // Found something
            // make the context. Each line where the query appears.
            const lines = item.content.split(/\r?\n/);
            const context = [];
            for (let i = 0; i < lines.length; ++i) {
                if (lines[i].indexOf(query) > -1) {
                    context.push(lines[i]);
                }
            }
            results.push({
                label: utils.pathToLabel(item.file),
                path: item.file,
                context: context
            });
        }
    });
    return results;
}

//=============================================================================
const buildIndex = function() {
    const files = [];
    walkSync('public/recipes', files);
    for (let i = 0; i < files.length; ++i) {
        const file = files[i];
        if (path.extname(file) === '.html') {
            fs.readFile(file, 'utf8', function(error, content) {
                if (error) throw error;
                index.push({
                    file: file,
                    content: content.toLowerCase()
                });
            });
        } else if (path.extname(file) === '.pdf') {
            
        }
    }    
}

module.exports.search = search;
module.exports.buildIndex = buildIndex;
