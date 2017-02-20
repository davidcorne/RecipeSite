'use strict';
const express = require('express');
const pug = require('pug');
const decode = require('urldecode')
const fs = require('fs');

const utils = require('./utils');
const log = require('./log');
const conversion = require('./conversion');
const search = require('./search');
const fileList = require('./file-list');

let index = {};

// Compile a function
const templates = {
    'index': pug.compileFile('template/index.pug'),
    'search': pug.compileFile('template/search.pug'),
    'search-not-ready': pug.compileFile('template/search-not-ready.pug'),
    'partial-load': pug.compileFile('template/partial-search.pug'),
    'conversion': pug.compileFile('template/conversion.pug'),
};

const app = express();
const http = require('http').Server(app);

app.set('port', (process.env.PORT || 3000));

let partialLoad = false;

//=============================================================================
process.on('message', function(message) {
    log.debug('Recieved ' + message);
    if (message in messageMap) {
        messageMap[message]();
    } else {
        log.error('Unknown message "' + message + '"');
    }
});

//=============================================================================
const loadSearchIndex = function() {
    partialLoad = false;
    search.buildIndex(index);
};

//=============================================================================
const partialLoadSearchIndex = function() {
    partialLoad = true;
    search.buildIndex(index);
};

//=============================================================================
const messageMap = {
    'load-search-index': loadSearchIndex,
    'partial-load-search-index': partialLoadSearchIndex
};

//=============================================================================
const logRequest = function(request) {
    log.debug(
        'Request: ' + request.path + ' ' + JSON.stringify(request.query)
    );
}

//=============================================================================
const sendTemplate = function(request, response, key, data) {
    // don't do anything fancy yet
    response.send(templates[key](data));
}

//=============================================================================
app.get('/', function(request, response) {
    logRequest(request);
    const locals = {
        recipes: fileList.generateFileList()
    };
    sendTemplate(request, response, 'index', locals);
});

//=============================================================================
app.get('/conversion', function(request, response) {
    logRequest(request);
    // A list of the conversions that we cover.
    sendTemplate(
        request,
        response,
        'conversion',
        {conversions: conversion.conversions}
    );
});

//=============================================================================
app.get('/public/*', function(request, response) {
    logRequest(request);
    const filePath = __dirname + decode(request.path);
    fs.stat(filePath, function(error, stats) {
        if (error) {
            response.status(404).send('Resource not found');
        } else {
            response.sendFile(filePath);
        }
    });
});

//=============================================================================
app.get('/search', function(request, response) {
    logRequest(request);
    const data = {
        query: request.query.query
    };
    if (Object.keys(index).length === 0) {
        // Send a search results not ready signal.
        sendTemplate(request, response, 'search-not-ready', data);
    } else {
        // We've got a search index, actually search it.
        const timer = utils.timer().start();
        const results = search.search(request.query.query, index);
        timer.stop();
        const key = partialLoad ? 'partial-load' : 'search';
        data['results'] = results;
        data['time'] = timer.milliseconds;
        sendTemplate(request, response, key, data);
    }
});

//=============================================================================
const start = function() {
    http.listen(app.get('port'), function() {
        log.info('Listening on *:' + app.get('port'));
    });
}

module.exports.start = start;

