themes = {}

themes.setTheme = function (theme) {
    // Create new link Element
    var themeCSS = document.createElement('link');

    // set the attributes for link element
    themeCSS.rel = 'stylesheet';
    themeCSS.type = 'text/css';
    themeCSS.href = '/public/resources/themes/' + theme + '.min.css';

    var indexCSS = document.createElement('link');

    // set the attributes for link element
    indexCSS.rel = 'stylesheet';
    indexCSS.type = 'text/css';
    indexCSS.href = '/public/resources/index.css';
    
    // Get HTML head element to append
    // link element to it
    var head = document.getElementsByTagName('HEAD')[0]
    head.appendChild(themeCSS);
    head.appendChild(indexCSS);
}
