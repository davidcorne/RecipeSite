'use strict'
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const jsdom = require('jsdom');

const utils = require('./utils');
const log = require('./log');

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
    pdfParser.on('pdfParser_dataError', function(errData) {
        log.error(errData);
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
        fs.writeFile(utils.cachePath(file), content, 'utf8', function(error) {
            if (error) throw error;
            log.silly('Cache written: ' + file);
        });
    });
};

//=============================================================================
const checkFileCache = function(file) {
    fs.stat(file, function(error, fileStats) {
        if (error) throw error;
        fs.stat(utils.cachePath(file), function(error, cacheStats) {
            if (error && error.code === 'ENOENT') {
                // The cache doesn't exist, make it.
                log.silly('Cache not made yet: ' + file);
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
const buildCache = function() {
    log.info('Building cache');
    utils.walk('public/recipes', function(file) {
        if (path.extname(file) !== '.cache') {
            checkFileCache(file);
        }
    });
};

buildCache();
