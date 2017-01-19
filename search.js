'use strict';
const fs = require('fs');
const path = require('path');

const utils = require('./utils');
const log = require('./log');

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
const pathToDisplayPath = function(file) {
    // comes in as public\recipes\A\B\C.X want to display A/B/C
    let displayPath = file.replace(/\\/g, '/');
    displayPath = displayPath.replace('public/recipes/', '');
    displayPath = displayPath.replace(/\..*/, '');
    return displayPath;
}

//=============================================================================
const search = function(query, index) {
    query = query.toLowerCase();
    const results = [];
    index.forEach(function(item) {
        if (item.content.toLowerCase().indexOf(query) > -1) {
            // Found something
            // make the context. Each line where the query appears.
            const lines = item.content.split(/\r?\n/);
            const context = [];
            // A metric of how good a match it is
            let match = 0;
            for (let i = 0; i < lines.length; ++i) {
                if (lines[i].toLowerCase().indexOf(query) > -1) {
                    match += lines[i].length;
                    context.push(lines[i]);
                }
            }
            results.push({
                label: utils.pathToLabel(item.file),
                path: item.file,
                displayPath: pathToDisplayPath(item.file),
                context: context,
                match: match
            });
        }
    });
    // Sort the results by the larger match is better (closer to the beginning)
    const resultSorter = function(a, b) {
        return b.match - a.match;
    };
    return results.sort(resultSorter);
}

//=============================================================================
const buildIndex = function(index) {
    const files = [];
    let count = 0;
    walkSync('public/recipes', files);
    files.forEach(function(file) {
        if (path.extname(file) !== '.cache') {
            // It's a file we need to make a cache for
            ++count;
            // Check we've not already cached it
            const result = index.find(function(item) {
                return item.file === file;
            });
            if (!result) {
                // If we've not got it already, read the cached file.
                const cacheFileName = utils.cachePath(file);
                fs.stat(cacheFileName, function(error, stat) {
                    if (!error) {
                        // The cache exists, read it
                        fs.readFile(cacheFileName, 'utf8', function(error, content) {
                            if (error) throw error;
                            index.push({
                                file: file,
                                content: content
                            });
                        });
                    }
                });
            }
        }
    });
    if (index.length === 0 || index.length < count) {
        // Schedule another index build in 0.5 seconds
        log.debug('Cache incomplete: index ' + index.length + ' count ' + count);
        const closure = function() {
            buildIndex(index);
        }
        setTimeout(closure, 500);
    } else {
        log.debug('Cache complete: index ' + index.length + ' count ' + count);
    }
}

//=============================================================================
const buildCache = function() {
    walk('public/recipes', function(file) {
        if (path.extname(file) !== '.cache') {
            checkFileCache(file);
        }
    });
};

module.exports.search = search;
module.exports.buildIndex = buildIndex;
