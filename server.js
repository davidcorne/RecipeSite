"use strict"; 
const app = require('express')();
const http = require('http').Server(app);
const pug = require('pug');
const decode = require('urldecode')
const fs = require('fs');
const path = require('path');

app.set('port', (process.env.PORT || 3000));

// Compile a function
const indexTemplate = pug.compileFile('index.pug');
const searchTemplate = pug.compileFile('search.pug');

//=============================================================================
// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = function(dir, filelist) {
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
const pathToLabel = function(pth) {
    return path.basename(pth, path.extname(pth));
}

//=============================================================================
const directoryToItem = function(dir) {
    const item = {
        label: path.basename(dir),
        files: [],
        directories: []
    };
    const files = fs.readdirSync(dir);
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            item.directories.push(directoryToItem(path.join(dir, file)));
        } else {
            const pth = path.join(dir, file);
            item.files.push({
                path: pth,
                label: pathToLabel(pth)
            });
        }
    });
    return item;
};

//=============================================================================
const generateFileList = function() {
    const fileList = [];
    const root = 'public/recipes';
    const files = fs.readdirSync(root);
    files.forEach(function(file) {
        fileList.push(directoryToItem(path.join(root, file)));
    });
    return fileList;
}

//=============================================================================
const generateIndex = function(response) {
    const locals = {
        recipes: generateFileList()
    };
    response.send(indexTemplate(locals));
};

//=============================================================================
const search = function(query) {
    query = query.toLowerCase();
    const files = [];
    walkSync('public/recipes', files);
    const results = [];
    for (let i = 0; i < files.length; ++i) {
        if (path.extname(files[i]) === '.html') {
            const contents = fs.readFileSync(files[i], 'utf8').toLowerCase();
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
    const results = search(request.query.query);
    response.send(searchTemplate({results: results}));
});

//=============================================================================
http.listen(app.get('port'), function() {
    console.log('Listening on *:' + app.get('port'));
});

