'use strict';
// <nnn> const rewire = require('rewire');
const chai = require('chai');
// <nnn> chai.use(require('chai-string'));
const assert = chai.assert;
// <nnn> const path = require('path');
const fs = require('fs');
// <nnn> const request = require('supertest');
const utils = require('./utils');
const async = require('async');

const fileList = require('./file-list');

console.log('Running Integration Tests');

//=============================================================================
describe('Cache', function() {

    it('Up to date', function(done) {
        let paths = [];
        const recursor = function(directory) {
            directory.files.forEach(function(file) {
                paths.push(file.path);
            });
            directory.directories.forEach(recursor);
        }
        const directories = fileList.generateFileList();
        directories.forEach(recursor);
        const test = function(path, callback) {
            fs.stat(path, function(error, fileStats) {
                if (error) callback(error);
                fs.stat(utils.cachePath(path), function(error, cacheStats) {
                    assert.isNull(error, 'The cache files should exist.');
                    assert.isAtLeast(
                        cacheStats.mtime,
                        fileStats.mtime,
                        'Cache should be newer than the file.'
                    );
                    callback();
                });
            });
        }
        async.each(paths, test, function(error) {
            assert.isNull(error);
            done();
        });
    });
});
