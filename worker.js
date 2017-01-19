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


app.get('/', function(request, response) {
    log.debug('Request /');
    const locals = {
        recipes: fileList.generateFileList()
    };
    response.send(indexTemplate(locals));
});

app.get('/public/*', function(request, response) {
    log.debug('Request ' + request.path);
    response.sendFile(__dirname + decode(request.path));
});

app.get('/search', function(request, response) {
    log.debug('Request ' + request.path);
    const results = search.search(request.query.query, index);
    response.send(searchTemplate({
        results: results,
        query: request.query.query
    }));
});

module.exports = function() {
    app.listen(app.get('port'), function() {
        log.info('Listening on *:' + app.get('port'));
    });
};

