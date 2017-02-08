'use strict';

const winston = require('winston');

// We want info to be the default logging level
winston.level = (process.env.LOG_LEVEL || 'info');

const log = function(level, string) {
    winston.log(level, string, {
        process: process.pid
    });
}

module.exports.error = (string) => {log('error', string);}
module.exports.warn =  (string) => {log('warn', string);}
module.exports.info =  (string) => {log('info', string);}
module.exports.debug = (string) => {log('debug', string);}
module.exports.silly = (string) => {log('silly', string);}
