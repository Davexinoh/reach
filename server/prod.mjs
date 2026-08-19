import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { reachApi } from "./api.mjs";

const dist = path.join(process.cwd(), "dist");
const api = reachApi();
const port = Number(process.env.PORT) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function sendFile(res, file, type) {
  res.statusCode = 200;
  res.setHeader("Content-Type", type);
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  api(req, res, () => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const rel = url === "/" ? "/index.html" : url;
    const file = path.join(dist, rel);
    if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return sendFile(res, file, MIME[path.extname(file)] || "application/octet-stream");
    }
    const index = path.join(dist, "index.html");
    if (fs.existsSync(index)) return sendFile(res, index, MIME[".html"]);
    res.statusCode = 404;
    res.end("not found");
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Reach listening on ${port}`);
});
