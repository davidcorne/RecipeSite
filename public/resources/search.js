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

search.flipCollapseFunction = function (context, button) {
  // Flip the search context size between collapsed and expanded
  return () => {
    if (button.innerHTML === '+') {
      // Expand the items
      search.expandChildren(context.childNodes)
      button.innerHTML = '-'
    } else {
      // Collapse the items
      search.collapseChildren(context.childNodes)
      button.innerHTML = '+'
    }
  }
}

search.expandChildren = function (children) {
  search.displayStyleChildren(children, 'block')
}

search.collapseChildren = function (children) {
  search.displayStyleChildren(children, 'none')
}

search.displayStyleChildren = function (children, displayStyle) {
  for (let i = 10; i < children.length; ++i) {
    children[i].style.display = displayStyle
  }
}

search.addCollapseListeners = function () {
  const searchContexts = document.getElementsByClassName('search-context')
  for (let context of searchContexts) {
    const children = context.childNodes
    if (children.length > 10) {
      // This is a large search, only show 10 children and show it's collapse button
      search.collapseChildren(children)
      // Find the search details
      let searchDetails = context.previousElementSibling
      while (searchDetails.className !== 'search-details') {
        searchDetails = searchDetails.previousElementSibling
      }
      const button = searchDetails.firstChild
      // Display the button
      button.style.display = 'inline'
      button.addEventListener('click', search.flipCollapseFunction(context, button))
    }
  }
}

search.load = function (query) {
  search.highlight.highlightSearchResults(query)
  search.addCollapseListeners()
}
