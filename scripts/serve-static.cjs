const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = 4173;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  return path.join(root, requested);
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || "/");
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static test server running at http://127.0.0.1:${port}`);
});

