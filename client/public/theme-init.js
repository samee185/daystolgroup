// Runs before the page paints, so the site opens in the right theme with no flash.
// A saved choice wins; otherwise follow the device's light/dark setting.
(function () {
  var theme = 'dark'
  try {
    var saved = localStorage.getItem('daystol-theme')
    if (saved === 'light' || saved === 'dark') theme = saved
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) theme = 'light'
  } catch (e) {
    // storage blocked: keep the default
  }
  document.documentElement.dataset.theme = theme
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F7FC' : '#0D1330')
})()
