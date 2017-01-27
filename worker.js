const express = require('express');
const pug = require('pug');
const decode = require('urldecode')
const log = require('./log');

const search = require('./search');
const fileList = require('./file-list');

const index = [];

// Compile a function
const indexTemplate = pug.compileFile('template/index.pug');
const searchTemplate = pug.compileFile('template/search.pug');
const searchNotReadyPage = pug.compileFile('template/search-not-ready.pug');

const app = express();
app.set('port', (process.env.PORT || 3000));

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
    search.buildIndex(index);
};

//=============================================================================
const messageMap = {
    'load-search-index': loadSearchIndex
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
app.get('/public/*', function(request, response) {
    logRequest(request);
    response.sendFile(__dirname + decode(request.path));
});

//=============================================================================
app.get('/search', function(request, response) {
    logRequest(request);
    if (index.length === 0) {
        // Send a search results not ready signal
        response.send(searchNotReadyPage());
    } else {
        // We've got a search index, actually search it.
        const start  = process.hrtime()
        const results = search.search(request.query.query, index);
        const end = process.hrtime(start)[1]/1000000;
        response.send(searchTemplate({
            results: results,
            query: request.query.query,
            time: Math.round(end * 100) / 100
        }));
    }
});

//=============================================================================
const start = function() {
    app.listen(app.get('port'), function() {
        log.info('Listening on *:' + app.get('port'));
    });
}

module.exports.start = start;

