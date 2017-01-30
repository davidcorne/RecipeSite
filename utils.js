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
    // <nnn> const files = [];
    // <nnn> const buildFileIndex = function(dir, index) {
    // <nnn>     if (fs.statSync
    // <nnn> };
    // <nnn> buildFileIndex(files);
    async.each(files, function(file, done) {
        callback(file);
        done();
    }, function(error) {
        if (error) throw error;
        if (end) end();
    });
    // <nnn> fs.readdir(dir, function(error, files) {
    // <nnn>     if (error) throw error;
    // <nnn>     files.forEach(function(file) {
    // <nnn>         const fullPath = path.join(dir, file);
    // <nnn>         fs.stat(fullPath, function(error, stats) {
    // <nnn>             if (error) throw error;
    // <nnn>             if (stats.isDirectory()) {
    // <nnn>                 walk(fullPath, callback);
    // <nnn>             } else {
    // <nnn>                 callback(fullPath);
    // <nnn>             }
    // <nnn>         });
    // <nnn>     });
    // <nnn> });
}

//=============================================================================
const pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

//=============================================================================
const cachePath = function(file) {
    return file.replace(/\..*/, '.cache');
}

module.exports.pathToLabel = pathToLabel;
module.exports.cachePath = cachePath;
module.exports.walk = walk;
