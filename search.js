'use strict';
const fs = require('graceful-fs');
const path = require('path');

const utils = require('./utils');
const log = require('./log');

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
    for (const file in index) {
        const content = index[file];
        if (content.toLowerCase().indexOf(query) > -1) {
            // Found something
            // make the context. Each line where the query appears.
            const lines = content.split(/\r?\n/);
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
                label: utils.pathToLabel(file),
                path: file,
                displayPath: pathToDisplayPath(file),
                context: context,
                match: match
            });
        }
    }
    // Sort the results by the larger match is better (closer to the beginning)
    const resultSorter = function(a, b) {
        return b.match - a.match;
    };
    return results.sort(resultSorter);
}

//=============================================================================
const readCacheFile = function(index, file) {
    if (path.extname(file) !== '.cache') {
        // Read the cached file.
        const cacheFileName = utils.cachePath(file);
        fs.stat(cacheFileName, function(error, cacheStats) {
            if (error && error.code === 'ENOENT') {
                // The cache doesn't exist, we could be in a partial search.
            } else {
                fs.readFile(
                    cacheFileName,
                    'utf8',
                    function(error, content) {
                        if (error) throw error;
                        index[file] = content;
                    }
                );
            }
        });
    }
};

//=============================================================================
const buildIndex = function(index) {
    const readFileCallback = function(file) {
        readCacheFile(index, file);
    }
    log.debug('Building search index.');
    utils.walk('public/recipes', readFileCallback);
}

module.exports.search = search;
module.exports.buildIndex = buildIndex;
