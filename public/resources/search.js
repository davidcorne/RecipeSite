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

search.addCollapseListeners = function () {
  const buttons = document.getElementsByClassName('collapse')
  for (let button of buttons) {
    button.addEventListener('click', function () {
      let searchContext = this.nextElementSibling
      if (searchContext.style.maxHeight === 'none') {
        searchContext.style.maxHeight = '230px'
        this.innerHTML = '+'
      } else {
        searchContext.style.maxHeight = 'none'
        this.innerHTML = '-'
      }
    })
  }
}

search.load = function (query) {
  search.highlight.highlightSearchResults(query)
  search.addCollapseListeners()
}
