'use strict'; 

const path = require('path');
const fs = require('fs');

//=============================================================================
const walk = function(dir, callback) {
    fs.readdir(dir, function(error, files) {
        if (error) throw error;
        files.forEach(function(file) {
            const fullPath = path.join(dir, file);
            fs.stat(fullPath, function(error, stats) {
                if (error) throw error;
                if (stats.isDirectory()) {
                    walk(fullPath, callback);
                } else {
                    callback(fullPath);
                }
            });
        });
    });
}

//=============================================================================
const pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

//=============================================================================
const cachePath = function(file) {
    return file.replace(/\..*/, '.cache');
}

//=============================================================================
const timer = function() {
    this.start = function() {
        this.time = process.hrtime();
        return this;
    };
    this.stop = function() {
        const end = process.hrtime(this.time)[1]/1000000;
        this.milliseconds = Math.round(end * 100) / 100;
    }
    return this;
}

module.exports.pathToLabel = pathToLabel;
module.exports.cachePath = cachePath;
module.exports.walk = walk;
module.exports.timer = timer;
