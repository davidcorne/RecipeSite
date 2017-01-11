"use strict"; 
const fs = require('fs');
const path = require('path');
const PDFParser = require("pdf2json");

// We add many events, node complains that this could be a memory
// leak. Increase the number of max listeners before node complains.
require('events').EventEmitter.prototype._maxListeners = 100;

const utils = require('./utils');

const index = [];

//=============================================================================
const addToIndex = function(file, content) {
    index.push({
        file: file,
        content: content.toLowerCase()
    });
}
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
            // A metric of how good a match it is
            let match = 0;
            for (let i = 0; i < lines.length; ++i) {
                if (lines[i].indexOf(query) > -1) {
                    match += lines[i].length;
                    context.push(lines[i]);
                }
            }
            results.push({
                label: utils.pathToLabel(item.file),
                path: item.file,
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
const addPdfToIndex = function(file, pdfParser) {
    // Return a closure containing the file and pdfParser, so that we can get
    // the raw text and also know which file to associate it with.
    return function(pdfData) {
        addToIndex(file, pdfParser.getRawTextContent());
        console.log('Parsed ' + file);
    }
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
                addToIndex(file, content);
            });
        } else if (path.extname(file) === '.pdf') {
            const pdfParser = new PDFParser(this, 1);
            readyFunction = addPdfToIndex(file, pdfParser);
            pdfParser.on("pdfParser_dataReady", readyFunction);
            pdfParser.loadPDF(file);
        }
    }    
}

module.exports.search = search;
module.exports.buildIndex = buildIndex;
