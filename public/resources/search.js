const search = {}
search.highlight = {}

search.highlight.highlightWord = function (word) {
  const expression = new RegExp('(' + word + ')', 'gi')
  const list = document.getElementById('search-result')
  if (list) {
    const paragraphs = list.getElementsByTagName('p')
    for (let i = 0; i < paragraphs.length; ++i) {
      const para = paragraphs[i]
      para.innerHTML = para.innerHTML.replace(
        expression,
        '<span class=query>$1</span>'
      )
    }
  }
}

search.highlight.highlightSearchResults = function (query) {
  const querySplit = query.trim().split(' ')
  querySplit.forEach(word => {
    search.highlight.highlightWord(word)
  })
}

search.maxHeight = '230px'

search.addCollapseListeners = function () {
  const searchContexts = document.getElementsByClassName('search-context')
  for (let context of searchContexts) {
    const height = context.clientHeight
    if (height > 230) {
      // This is a large search, limit it's height and show it's collapse button
      context.style.maxHeight = search.maxHeight
      // Find the search details
      let searchDetails = context.previousElementSibling
      while (searchDetails.className !== 'search-details') {
        searchDetails = searchDetails.previousElementSibling
      }
      const button = searchDetails.firstChild
      // Display the button
      button.style.display = 'inline'
      button.addEventListener('click', function () {
        // Flip the search context size between collapsed and expanded
        if (context.style.maxHeight === 'none') {
          context.style.maxHeight = search.maxHeight
          this.innerHTML = '+'
        } else {
          context.style.maxHeight = 'none'
          this.innerHTML = '-'
        }
      })
    }
  }
}

search.load = function (query) {
  search.highlight.highlightSearchResults(query)
  search.addCollapseListeners()
}