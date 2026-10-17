// Controls the preloader written into index.html.
// The app calls window.__dzBootDone() once it has rendered; a timer removes it anyway after 8 seconds.
(function () {
  var boot = document.getElementById('dz-boot')
  if (!boot) return
  var first = true
  try {
    first = !sessionStorage.getItem('dz-boot')
    sessionStorage.setItem('dz-boot', '1')
  } catch (e) {
    // storage blocked: treat as a first visit
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var full = first && !reduce
  if (!full) boot.classList.add('dz-quick')
  var start = Date.now()
  var finished = false
  function done() {
    if (finished) return
    finished = true
    // The first-visit animation gets about a second to play; otherwise it goes straight away.
    var wait = full ? Math.max(0, 1100 - (Date.now() - start)) : 0
    setTimeout(function () {
      boot.classList.add('dz-out')
      setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot) }, 450)
    }, wait)
  }
  window.__dzBootDone = done
  setTimeout(done, 8000)
})()
