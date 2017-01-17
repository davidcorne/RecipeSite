'use strict'; 
const app = require('express')();
const http = require('http').Server(app);
const pug = require('pug');
const decode = require('urldecode')

const search = require('./search');
const fileList = require('./file-list');

app.set('port', (process.env.PORT || 3000));

// Compile a function
const indexTemplate = pug.compileFile('template/index.pug');
const searchTemplate = pug.compileFile('template/search.pug');

const index = [];

//=============================================================================
app.get('/', function(request, response) {
    const locals = {
        recipes: fileList.generateFileList()
    };
    response.send(indexTemplate(locals));
});

//=============================================================================
app.get('/public/*', function(request, response) {
    response.sendFile(__dirname + decode(request.path));
});

//=============================================================================
app.get('/search', function(request, response) {
    const results = search.search(request.query.query, index);
    response.send(searchTemplate({
        results: results,
        query: request.query.query
    }));
});

//=============================================================================
http.listen(app.get('port'), function() {
    console.log('Listening on *:' + app.get('port'));
    search.buildIndex(index);
});

