'use strict';
const cluster = require('cluster');
const log = require('./log');
const child_process = require('child_process')
const os = require('os');

const numWorkers = (process.env.WORKERS || os.cpus().length);

//=============================================================================
const startWorkers = function() {
    // cluster.workers has no length, or keys.length
    let currentWorkers = 0;
    for (const id in cluster.workers) {
        ++currentWorkers;
    }
    const workersToSetup = numWorkers - currentWorkers;
    log.info('Master cluster setting up ' + workersToSetup + ' more workers');

    // Add a hook to the online event, whenever we get a new worker we want it
    // to read the search index.
    cluster.on('online', function(worker) {
        worker.process.send('load-search-index');
    });

    for(let i = 0; i < workersToSetup; i++) {
        cluster.fork();
    }
}

//=============================================================================
const startInitialWorkers = function() {
    // Start two workers initially, so that the pdf reading communication
    // doesn't use too much RAM on the free hosting we use.
    log.info('Master cluster setting up initial workers.');
    cluster.on('online', function(worker) {
        log.info('Worker ' + worker.process.pid + ' is online.');
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
        log.info('Starting a new worker.');
        cluster.fork();
    });
    // Make 2 workers, unless we have fewer cores.
    for (let i = 0; i < Math.min(2, numWorkers); ++i) {
        cluster.fork();
    }
}

//=============================================================================
const start = function() {
    const child = child_process.fork('run-build-cache.js');
    child.on('close', function(code) {
        if (code !== 0) {
            log.error('build-cache process ended with code ' + code);
        } else {
            log.info('Cache built.');
            // Send an event to each worker
            for (const id in cluster.workers) {
                cluster.workers[id].process.send('load-search-index');
            }
            startWorkers();
        }
    });
    child.on('message', function(messsage) {
        if (messsage === 'partial-cache') {
            // Notify the workers
            for (const id in cluster.workers) {
                cluster.workers[id].process.send('partial-load-search-index');
            }
        }
    });
    startInitialWorkers();
};

module.exports.start = start;
