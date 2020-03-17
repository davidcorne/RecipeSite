// Overwrite the "headline" with just a link
window.onload = function () {
  const headlineEl = document.getElementById('headline')
  if (headlineEl) {
    headlineEl.innerHTML = '<a class="home-link" href="/">Home</a>'
  }
}
