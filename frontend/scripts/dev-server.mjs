import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };

const portals = [
  { port: 4173, entrypoint: "/views/admin/index.html", name: "Admin" },
  { port: 4174, entrypoint: "/views/manager/index.html", name: "Manager" },
  { port: 4175, entrypoint: "/views/front/index.html", name: "User" }
];

const handleRequest = entrypoint => async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const entrypoints = { "/admin": "/views/admin/index.html", "/manager": "/views/manager/index.html", "/customer": "/views/front/index.html" };
    let pathname = decodeURIComponent((url.pathname === "/" ? entrypoint : entrypoints[url.pathname]) || url.pathname);
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root)) throw new Error("Invalid path");
    if (!(await stat(target)).isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Không tìm thấy tài nguyên");
  }
};

for (const portal of portals) {
  createServer(handleRequest(portal.entrypoint)).listen(portal.port, "127.0.0.1", () => {
    console.log(`${portal.name.padEnd(8)} http://127.0.0.1:${portal.port}/`);
  });
}
