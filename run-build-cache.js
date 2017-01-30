'use strict'

const buildCache = require('./build-cache');
// <nnn> 
// <nnn> NO
// <nnn> setTimeout(function() {buildCache.buildCache('public/recipes');}, 30000);
buildCache.buildCache('public/recipes');
