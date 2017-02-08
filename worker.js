'use strict';
const express = require('express');
const pug = require('pug');
const decode = require('urldecode')
const utils = require('./utils');
const log = require('./log');

const search = require('./search');
const fileList = require('./file-list');

let index = {};

// Compile a function
const indexTemplate = pug.compileFile('template/index.pug');
const searchTemplate = pug.compileFile('template/search.pug');
const searchNotReadyPage = pug.compileFile('template/search-not-ready.pug');
const partialLoadTemplate = pug.compileFile('template/partial-search.pug');
const conversionTemplate = pug.compileFile('template/conversion.pug');

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
app.get('/', function(request, response) {
    logRequest(request);
    const locals = {
        recipes: fileList.generateFileList()
    };
    response.send(indexTemplate(locals));
});

//=============================================================================
app.get('/conversion', function(request, response) {
    logRequest(request);
    // A list of the conversions that we cover.
    const conversions = [
        {
            ingredient: 'Flour',
            type:       'weight',
            cup:        136
        },
        {
            ingredient: 'Almond Milk',
            type:       'volume',
            cup:        240
        },
    ];
    response.send(conversionTemplate({conversions: conversions}));
});

//=============================================================================
app.get('/public/*', function(request, response) {
    logRequest(request);
    response.sendFile(__dirname + decode(request.path));
});

//=============================================================================
app.get('/search', function(request, response) {
    logRequest(request);
    if (Object.keys(index).length === 0) {
        // Send a search results not ready signal.
        response.send(searchNotReadyPage());
    } else {
        // We've got a search index, actually search it.
        const timer = utils.timer().start();
        const results = search.search(request.query.query, index);
        timer.stop();
        const template = partialLoad ? partialLoadTemplate : searchTemplate;
        response.send(template({
            results: results,
            query: request.query.query,
            time: timer.milliseconds
        }));
    }
});

//=============================================================================
const start = function() {
    http.listen(app.get('port'), function() {
        log.info('Listening on *:' + app.get('port'));
    });
}

module.exports.start = start;

