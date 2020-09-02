// Overwrite the "headline" with just a link
window.onload = function () {
  const headlineEl = document.getElementById('headline')
  if (headlineEl) {
    headlineEl.innerHTML = '<a class="home-link" href="/">Home</a>'
  }
  const images = document.getElementsByTagName('img')
  for (const img of images) {
    if (img.alt && !img.title) {
      img.title = img.alt
    }
  }
}
