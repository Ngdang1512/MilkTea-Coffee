import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const port = Number(process.env.PORT || 4173);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const entrypoints = { "/": "/views/admin/index.html", "/admin": "/views/admin/index.html", "/manager": "/views/manager/index.html", "/customer": "/views/front/index.html" };
    let pathname = decodeURIComponent(entrypoints[url.pathname] || url.pathname);
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root)) throw new Error("Invalid path");
    if (!(await stat(target)).isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream" });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Không tìm thấy tài nguyên");
  }
}).listen(port, () => console.log(`milktea-coffee đang chạy tại http://localhost:${port}`));
