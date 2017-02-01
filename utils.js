'use strict'; 

const path = require('path');
const fs = require('fs');
const async = require('async');

//=============================================================================
var walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

//=============================================================================
const walk = function(dir, callback, end) {
    // Get a list of files in sync, then operate on them in an async fashion
    const files = walkSync(dir, []);
    async.each(files, function(file, done) {
        callback(file, done);
    }, function(error) {
        if (error) throw error;
        if (end) end();
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
