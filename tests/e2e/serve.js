// A small static file server for the browser tests: it serves app/site exactly as the files are.
//
// Why not `python3 -m http.server`: Python's server keeps only 5 waiting connections, and a browser
// loading a page opens more at once. On macOS the extras were reset, so a script such as
// data/core.js sometimes did not arrive and the tests failed at random. Node's server queues
// hundreds. Node is needed for these tests anyway, and this works the same on Windows, macOS and Linux.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "app", "site");
const PORT = Number(process.env.PORT || 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
                ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2" };

http.createServer((request, response) => {
  // Only the path matters (not "?noscan" or "#state"). A path that climbs out of the site folder is refused.
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let file = path.normalize(path.join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { response.writeHead(403).end("Forbidden"); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end("Not found"); return; }          // /api/live is not served here: the page uses its saved reading
    response.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" }).end(data);
  });
}).listen(PORT, "127.0.0.1", () => console.log("serving " + ROOT + " on http://127.0.0.1:" + PORT));
