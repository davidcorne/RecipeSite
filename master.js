'use strict';
const cluster = require('cluster');
const log = require('./log');
const child_process = require('child_process')

const numWorkers = require('os').cpus().length;

//=============================================================================
const startWorkers = function() {
    log.info('Master cluster setting up ' + numWorkers + ' workers...');

    for(let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        log.info('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        log.info(
            'Worker ' + 
                worker.process.pid +
                ' died with code: '
                + code +
                ', and signal: '
                + signal
        );
        log.info('Starting a new worker');
        cluster.fork();
    });
}

//=============================================================================
const start = function() {
    const child = child_process.fork('build-cache.js');
    child.on('close', function(code) {
        if (code !== 0) {
            log.error('build-cache process ended with code ' + code);
        } else {
            log.info('Cache built.');
            startWorkers();
        }
    });
}

module.exports = start;
