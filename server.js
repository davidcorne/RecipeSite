"use strict"; 
const app = require('express')();
const http = require('http').Server(app);
const pug = require('pug');
const decode = require('urldecode')
const fs = require('fs');
const path = require('path');

// Compile a function
const indexTemplate = pug.compileFile('index.pug');
const searchTemplate = pug.compileFile('search.pug');

//=============================================================================
// List all files in a directory in Node.js recursively in a synchronous fashion
let walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
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
let pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

//=============================================================================
let generateFileList = function() {
    const files = [];
    walkSync('public/recipes', files);
    const fileList = [];
    for (let i = 0; i < files.length; ++i) {
        fileList.push({
            label: pathToLabel(files[i]),
            path: files[i]
        });
    }
    return fileList;
    // e.g.
    // fileList = [
    //     {
    //         label: Dessert,
    //         directories: [
    //             {
    //                 label: Sauce,
    //                 directories: [],
    //                 files: [
    //                     {
    //                         label: 'Sticky Toffee Sauce',
    //                         path: 'public/recipes/Dessert/Sauce/Sticky Toffee Sauce.html'
    //                     }
    //                 ]
    //             }
    //         ],
    //         files: [
    //             {
    //                 label: 'Caramel Shortbread',
    //                 path: 'public/recipes/Dessert/Caramel Shortbread.html'
    //             }
    //         ]
    //     }
    // ]
                
           
}

//=============================================================================
let generateIndex = function(response) {
    let locals = {
        recipes: generateFileList()
    };
    response.send(indexTemplate(locals));
};

//=============================================================================
let search = function(query) {
    const files = [];
    walkSync('public/recipes', files);
    const results = [];
    for (let i = 0; i < files.length; ++i) {
        if (path.extname(files[i]) === '.html') {
            const contents = fs.readFileSync(files[i], 'utf8');
            if (contents.indexOf(query) > -1) {
                // make the context. Each line where the query appears.
                const lines = contents.split(/\r?\n/);
                const context = [];
                for (let j = 0; j < lines.length; ++j) {
                    if (lines[j].indexOf(query) > -1) {
                        context.push(lines[j]);
                    }
                }
                results.push({
                    label: pathToLabel(files[i]),
                    path: files[i],
                    context: context
                });
            }
        }
    }
    return results;
};

//=============================================================================
app.get('/', function(request, response) {
    generateIndex(response);
});

//=============================================================================
app.get('/public/*', function(request, response) {
    response.sendFile(__dirname + decode(request.path));
});

//=============================================================================
app.get('/search', function(request, response) {
    let results = search(request.query.query);
    response.send(searchTemplate({results: results}));
});

//=============================================================================
http.listen(3000, function() {
    console.log('Listening on *:3000');
});

