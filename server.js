const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4600;
const HOST = '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const server = http.createServer((req, res) => {
  // Parse URL, strip query
  let url = req.url.split('?')[0];
  
  // Security: prevent directory traversal
  if (url.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Default to index.html
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    // Try without extension
    const withHtml = filePath + '.html';
    if (fs.existsSync(withHtml)) {
      serveFile(withHtml, res);
      return;
    }
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  serveFile(filePath, res);
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

server.listen(PORT, HOST, () => {
  console.log(`Server attivo su http://${HOST}:${PORT}/`);
  console.log(`URL: http://localhost:${PORT}/`);
});
