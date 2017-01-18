'use strict'; 

var cluster = require('cluster');

if(cluster.isMaster) {
    const numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for(let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log(
            'Worker ' + 
                worker.process.pid +
                ' died with code: '
                + code +
                ', and signal: '
                + signal
        );
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    const express = require('express');
    const pug = require('pug');
    const decode = require('urldecode')

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
        console.log('Process ' + process.pid + ' request /');
        const locals = {
            recipes: fileList.generateFileList()
        };
        response.send(indexTemplate(locals));
    });

    app.get('/public/*', function(request, response) {
        console.log('Process ' + process.pid + ' request ' + request.path);
        response.sendFile(__dirname + decode(request.path));
    });

    app.get('/search', function(request, response) {
        console.log('Process ' + process.pid + ' request /search');
        const results = search.search(request.query.query, index);
        response.send(searchTemplate({
            results: results,
            query: request.query.query
        }));
    });

    app.listen(app.get('port'), function() {
        console.log('Process ' + process.pid + ' listening on *:' + app.get('port'));
    });

}

