'use strict'
const fs = require('graceful-fs');
const path = require('path');
const PDFParser = require('pdf2json');
const jsdom = require('jsdom');
const md5 = require('md5-file');

const utils = require('./utils');
const log = require('./log');

const pdfQueue = [];

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
    log.silly('Caching ' + file);
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on('pdfParser_dataReady', function(pdfData) {
        callback(pdfParser.getRawTextContent());
        getNextPdf(callback);
    });
    pdfParser.on('pdfParser_dataError', function(errData) {
        log.error(errData);
        getNextPdf(callback);
    });
    pdfParser.loadPDF(file);
};

//=============================================================================
const getNextPdf = function(callback) {
    if (pdfQueue.length) {
        const file = pdfQueue.pop();
        getPdfCacheContent(file, callback);
    }
}

//=============================================================================
const getOtherCacheContent = function(file, callback) {
    // We don't know how to get content from this file (it's probably an
    // image) so settle for returning the file name.
    callback(utils.pathToLabel(file));
}

//=============================================================================
const getCacheContent = function(file, callback) {
    const extension = path.extname(file);
    if (extension === '.html') {
        getHtmlCacheContent(file, callback);
    } else if (extension === '.pdf') {
      pdfQueue.push(file);
      if (pdfQueue.length === 1) {
          getNextPdf(callback);
      }
    } else {
        // Not a html or pdf, we don't know exactly how to get content from it
        // (it's probably a picture). So treat it as "other"
        getOtherCacheContent(file, callback);
    }
};

//=============================================================================
const cacheFile = function(file, callback) {
    getCacheContent(file, function(content) {
        md5(file, function(error, hash) {
            if (error) throw error;
            content = hash + '\n' + content;
            fs.writeFile(utils.cachePath(file), content, 'utf8', function(error) {
                if (error) throw error;
                log.silly('Cache written: ' + file);
                callback();
            });
        });
    });
};

//=============================================================================
const checkFileCache = function(file) {
    const cached = function() {
        // If we are in a child process
        if (process.send) {
            process.send('partial-cache');
        }
    }    
    fs.stat(file, function(error, fileStats) {
        if (error) throw error;
        fs.stat(utils.cachePath(file), function(error, cacheStats) {
            if (error && error.code === 'ENOENT') {
                // The cache doesn't exist, make it.
                log.silly('Cache not made yet: ' + file);
                cacheFile(file, cached);
            } else {
                // Check how up to date the cache is, compare the modification
                // times.
                if (cacheStats.mtime < fileStats.mtime) {
                    // The file has been modified since the cache, update it.
                    log.silly('Cache out of date: ' + file);
                    cacheFile(file, cached);
                } else {
                    log.silly('Cache up to date: ' + file);
                }
            }
        });
    });
}

//=============================================================================
const buildCache = function(directory) {
    log.info('Building cache of ' + directory);
    utils.walk(directory, function(file) {
        if (path.extname(file) !== '.cache') {
            checkFileCache(file);
        }
    });
};

module.exports.buildCache = buildCache;
