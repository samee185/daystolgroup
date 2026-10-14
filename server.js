// Entry file for Hostinger and `npm start`.
// Hostinger's runner (LiteSpeed) loads this file with require(), so it is plain CommonJS and loads the
// app (an ES module in server/) with import(), which works on every host.
import('./server/src/index.js').catch((err) => {
  console.error('The server failed to start:', err)
  process.exit(1)
})
