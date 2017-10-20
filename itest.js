'use strict';
const chai = require('chai');
const assert = chai.assert;
const fs = require('fs');
const async = require('async');
const md5 = require('md5-file');
const firstline = require('firstline');

const utils = require('./utils');
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
            const cache = utils.cachePath(path);
            assert.isOk(fs.existsSync(cache));
            // Check it has the correct hash
            md5(path, function(error, hash) {
                assert.isNull(error);
                const check = function(line) {
                    assert.strictEqual(
                        hash,
                        line,
                        'Hash is incorrect for ' + path
                    );
                    callback();
                }
                const errorThrow = function(err) {
                    throw err;
                }
                firstline(cache).then(check, errorThrow);
            });
        }
        async.each(paths, test, function(error) {
            assert.isNull(error);
            done();
        });
    });
});
