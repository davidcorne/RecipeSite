'use strict';
const cluster = require('cluster');
const log = require('./log');
const child_process = require('child_process')

const numWorkers = require('os').cpus().length;

//=============================================================================
const startWorkers = function(initialWorker) {
    log.info('Master killing initial worker.');
    initialWorker.kill('SIGTERM');
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
    // So we don't get it accidentally restarted, use child_process to start
    // the initial worker. (exitedAfterDisconnect didn't get set properly)
    const initialWorker = child_process.fork('worker.js');
    initialWorker.on('error', function(code, signal) {
        log.error('Inital worker error: code=' + code + ' signal=' + signal);
    });
    initialWorker.on('close', function(code) {
        log.info('initialWorker closed.');
    });
    const child = child_process.fork('build-cache.js');
    child.on('close', function(code) {
        if (code !== 0) {
            log.error('build-cache process ended with code ' + code);
        } else {
            log.info('Cache built.');
            startWorkers(initialWorker);
        }
    });
}();
