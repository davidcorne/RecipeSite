'use strict';
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const jsdom = require('jsdom');

const utils = require('./utils');
const log = require('./log');

//=============================================================================
const walk = function(dir, callback) {
    fs.readdir(dir, function(error, files) {
        if (error) throw error;
        files.forEach(function(file) {
            const fullPath = path.join(dir, file);
            fs.stat(fullPath, function(error, stats) {
                if (error) throw error;
                if (stats.isDirectory()) {
                    walk(fullPath, callback);
                } else {
                    callback(fullPath);
                }
            });
        });
    });
}

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
const cachePath = function(file) {
    return file.replace(/\..*/, '.cache');
}

//=============================================================================
const getHtmlCacheContent = function(file, callback) {
    fs.readFile(file, 'utf8', function(error, content) {
        if (error) throw error;
        jsdom.env(content, function(error, window) {
            let markdown = '';
            const title = window.document.getElementsByTagName('title')[0];
            markdown += title.innerHTML;
            const xmp = window.document.getElementsByTagName('xmp')[0];
            markdown += xmp.innerHTML;
            window.close();
            callback(markdown);
        });
    });
};

//=============================================================================
const getPdfCacheContent = function(file, callback) {
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on('pdfParser_dataReady', function(pdfData) {
        callback(pdfParser.getRawTextContent());
    });
    pdfParser.loadPDF(file);
};

//=============================================================================
const getCacheContent = function(file, callback) {
    const extension = path.extname(file);
    if (extension === '.html') {
        getHtmlCacheContent(file, callback);
    } else if (extension === '.pdf') {
        getPdfCacheContent(file, callback);
    }
};

//=============================================================================
const cacheFile = function(file) {
    getCacheContent(file, function(content) {
        fs.writeFile(cachePath(file), content, 'utf8', function(error) {
            if (error) throw error;
            log.debug('Cache written: ' + file);
        });
    });
};

//=============================================================================
const checkFileCache = function(file) {
    fs.stat(file, function(error, fileStats) {
        if (error) throw error;
        fs.stat(cachePath(file), function(error, cacheStats) {
            if (error && error.code === 'ENOENT') {
                // The cache doesn't exist, make it.
                log.silly('Cache not found: ' + file);
                cacheFile(file);
            } else {
                // Check how up to date the cache is, compare the modification
                // times.
                if (cacheStats.mtime < fileStats.mtime) {
                    // The file has been modified since the cache, update it.
                    log.silly('Cache out of date: ' + file);
                    cacheFile(file);
                } else {
                    log.silly('Cache up to date: ' + file);
                }
            }
        });
    });
}

//=============================================================================
const buildIndex = function(index) {
    const files = [];
    walk('public/recipes', function(file) {
        if (path.extname(file) === '.cache') {
            // Read the cached file
            fs.readFile(cachePath(file), 'utf8', function(error, content) {
                if (error) throw error;
                index.push({
                    file: file,
                    content: content
                });
            });
        }
    });
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
module.exports.buildCache = buildCache;
module.exports.buildIndex = buildIndex;
