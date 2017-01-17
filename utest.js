const rewire = require('rewire');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;

const search = rewire('./search.js');
const getHtmlCacheContent = search.__get__('getHtmlCacheContent');
const getPdfCacheContent = search.__get__('getPdfCacheContent');

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
