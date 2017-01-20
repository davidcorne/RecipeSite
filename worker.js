const express = require('express');
const pug = require('pug');
const decode = require('urldecode')
const log = require('./log');

const search = require('./search');
const fileList = require('./file-list');

const index = [];
search.buildIndex(index);

// Compile a function
const indexTemplate = pug.compileFile('template/index.pug');
const searchTemplate = pug.compileFile('template/search.pug');

const app = express();
app.set('port', (process.env.PORT || 3000));

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
        const searchNotReadyPage = 
            pug.compileFile('template/search-not-ready.pug');
        response.send(searchNotReadyPage());
    } else {
        // We've got a search index, actually search it.
        const results = search.search(request.query.query, index);
        response.send(searchTemplate({
            results: results,
            query: request.query.query
        }));
    }
});

//=============================================================================
app.listen(app.get('port'), function() {
    log.info('Listening on *:' + app.get('port'));
});

