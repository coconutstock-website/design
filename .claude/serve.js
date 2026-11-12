// Minimal static server for previewing the homepage variations locally.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const port = +process.env.PORT || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  // variation-a/b/c share one assets folder and one script
  p = p.replace(/^\/variation-[a-z]\/assets\//, '/assets/').replace(/^\/variation-[a-z]\/app\.js$/, '/shared/app.js');
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
