'use strict';
const cluster = require('cluster');
const log = require('./log');

const numWorkers = require('os').cpus().length;

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
