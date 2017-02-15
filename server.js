'use strict';
const cluster = require('cluster');

if(cluster.isMaster) {
    require('./master').start();
} else {
    require('./worker').start();
}

