// Overwrite the "headline" with just a link
window.onload = function () {
  const headlineEl = document.getElementById('headline')
  if (headlineEl) {
    headlineEl.innerHTML = `
    <a class="home-link" href="/">Home</a>
    <div class="dropdown">
      <a class="home-link">Themes</a>
      <div class="dropdown-content">
        <a onclick="themes.setTheme('default')">Default</a>
        <a onclick="themes.setTheme('cerulean')">Cerulean</a>
        <a onclick="themes.setTheme('slate')">Slate</a>
      </div>
    </div>
    `
  }
  const images = document.getElementsByTagName('img')
  for (const img of images) {
    if (img.alt && !img.title) {
      img.title = img.alt
    }
  }
}
