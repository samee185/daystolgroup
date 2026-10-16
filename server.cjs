// Alternative entry file for hosts that load the app with require() (LiteSpeed's Node.js runner on
// Hostinger does). The app itself is an ES module, so this loads it with import() instead.
import('./server.js').catch((err) => {
  console.error('The server failed to start:', err)
  process.exit(1)
})

