'use strict';
const rewire = require('rewire');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');

const searchModule = rewire('./search.js');
const buildCacheModule = rewire('./build-cache.js');

const getHtmlCacheContent = buildCacheModule.__get__('getHtmlCacheContent');
const getPdfCacheContent = buildCacheModule.__get__('getPdfCacheContent');
const search = searchModule.__get__('search');

//=============================================================================
describe('Caches', function() {
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
