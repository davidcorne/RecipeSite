//=============================================================================
const highlight = {};

//=============================================================================
highlight.highlightSearchResults = function(query) {
    const expression = new RegExp('\(' + query + '\)', 'gi');
    const list = document.getElementById('search-result');
    if (list) {
        const paragraphs = list.getElementsByTagName('p');
        for (let i = 0; i < paragraphs.length; ++i) {
            const para = paragraphs[i];
            para.innerHTML = para.innerHTML.replace(
                expression, 
                '<span class=query>$1</span>'
            );
        }
    }
    
}
