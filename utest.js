'use strict';
const rewire = require('rewire');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');
const request = require('supertest');
const async = require('async');

const searchModule = rewire('./search.js');
const buildCacheModule = rewire('./build-cache.js');
const workerModule = rewire('./worker.js');

//=============================================================================
describe('Caches', function() {
    const getHtmlCacheContent = buildCacheModule.__get__('getHtmlCacheContent');
    const getPdfCacheContent = buildCacheModule.__get__('getPdfCacheContent');
    it('HTML cache', function(done) {
        getHtmlCacheContent('test_data/test_recipe.html', (content) => {
            var expected = `Test Recipe Title
# Test Recipe #

## Ingredients 

- Something

## Method

1. Test the recipe.
`;
            assert.strictEqual(content, expected);
            done();
        });
    });
    it('PDF cache', function(done) {
        getPdfCacheContent('test_data/test_recipe.pdf', (content) => {
            assert.include(content, 'Test Recipe');
            assert.include(content, 'Ingredients');
            assert.include(content, 'Something');
            assert.include(content, 'Test the recipe.');
            done();
        });
    });
});

//=============================================================================
describe('Search', function() {
    assert.searchResultEqual = function(result, expected) {
        assert.strictEqual(result.label,          expected.label);
        assert.strictEqual(result.path,           expected.path);
        assert.strictEqual(result.displayPath,    expected.displayPath);
        assert.strictEqual(result.match,          expected.match);
        assert.strictEqual(result.context.length, expected.context.length);
        for (let i = 0; i < expected.context.length; ++i) {
            assert.strictEqual(result.context[i], expected.context[i]);
        }
    }
    it('search', function() {
        const search = searchModule.__get__('search');
        const index = {};
        index[path.join('A', 'B', 'c.path')] = 'This is found';
        index[path.join('A', 'C', 'd.path')] = 'This is FOUND, but longer!';
        index['c'] = 'This is foand';

        const results = search('found', index);
        // This tests:
        //   - finding the label
        //   - manipulating the display path
        //   - getting the match number
        //   - ordering the results by match number
        const expected = [
            {
                label:       'd',
                path:        path.join('A', 'C', 'd.path'),
                displayPath: 'A/C/d',
                context:     ['This is FOUND, but longer!'],
                match:       'This is FOUND, but longer!'.length
            },
            {
                label:       'c',
                path:        path.join('A', 'B', 'c.path'),
                displayPath: 'A/B/c',
                context:     ['This is found'],
                match:       'This is found'.length
            }
        ]
        assert.strictEqual(results.length, 2);
        assert.searchResultEqual(results[0], expected[0]);
        assert.searchResultEqual(results[1], expected[1]);
    });
});

//=============================================================================
describe('Routing', function() {
    it('Existing', function(done) {
        const app = workerModule.__get__('app');
        const server = app.listen();
        
        // Respondes to all the routes.
        async.series([
            (cb) => {request(server).get('/').expect(200, cb);},
            (cb) => {request(server).get('/conversion').expect(200, cb);},
            (cb) => {request(server).get('/public/resources/index.css').expect(200, cb);},
            (cb) => {request(server).get('/search').expect(200, cb);}
        ], function(error) {
            if (error) throw error;
            server.close(done);
        });
        
    });
    it('Non-existing', function(done) {
        // Try to get some non-existant routes
        const app = workerModule.__get__('app');
        const server = app.listen();
        
        // Respondes to all the routes.
        async.series([
            (cb) => {request(server).get('/adsadsahdjasvdb').expect(404, cb);},
            (cb) => {request(server).get('/public/non-existing').expect(404, cb);},
        ], function(error) {
            if (error) throw error;
            server.close(done);
        });
    });
    it('Search not ready', function(done) {
        const app = workerModule.__get__('app');
        const server = app.listen();
        request(server).get('/search?query=bean').expect(200, function(error, response) {
            assert.include(response.text, 'Search results are not ready yet.');
            assert.include(response.text, 'public/resources/search-not-ready.js');
            done();
        });
    });
    it('Search not found', function(done) {
        const app = workerModule.__get__('app');
        const index = {};
        index['test 1'] = 'never found';
        workerModule.__set__('index', index);

        const server = app.listen();
        
        request(server).get('/search?query=always').expect(200, function(error, response) {
            assert.include(response.text, 'Your search - always - did not match any documents.');
            // Clean up after ourselves
            workerModule.__set__('index', {});
            done();
        });
    });
    it('Search found', function(done) {
        const app = workerModule.__get__('app');
        const index = {};
        index['test 1'] = 'The context of a bean\nNot this line though.';
        index['test 2'] = 'baen';
        workerModule.__set__('index', index);

        const server = app.listen();

        request(server).get('/search?query=bean').expect(200, function(error, response) {
            // We care that it found 1 thing, and it gives you context.
            assert.include(response.text, '1 results');
            assert.include(response.text, 'test 1');
            assert.include(response.text, 'The context of a bean');
            assert.notInclude(response.text, 'Not this line though.');
            // Clean up after ourselves
            workerModule.__set__('index', {});
            done();
        });
    });
});
