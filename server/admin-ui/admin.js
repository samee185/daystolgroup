/* Daystol admin: light and dark mode. The choice is remembered in this browser. */
(function () {
  var KEY = 'daystol-admin-theme'
  var root = document.documentElement

  function saved() {
    try { return localStorage.getItem(KEY) } catch (e) { return null }
  }
  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  function apply(theme) {
    root.setAttribute('data-adm-theme', theme)
    var btn = document.querySelector('.dz-theme-toggle')
    if (btn) render(btn, theme)
  }
  function render(btn, theme) {
    var dark = theme === 'dark'
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
    btn.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode')
    btn.innerHTML = dark
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span>Light mode</span>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><span>Dark mode</span>'
  }

  apply(saved() || (prefersDark() ? 'dark' : 'light'))

  function addButton() {
    if (document.querySelector('.dz-theme-toggle')) return
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'dz-theme-toggle'
    render(btn, root.getAttribute('data-adm-theme'))
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-adm-theme') === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(KEY, next) } catch (e) { /* private browsing: works until the tab closes */ }
      apply(next)
    })
    document.body.appendChild(btn)
  }

  if (document.body) addButton()
  else document.addEventListener('DOMContentLoaded', addButton)
})()
