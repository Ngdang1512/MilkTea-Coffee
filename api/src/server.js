import { createServer } from "node:http";

const port = Number(process.env.API_PORT || 3000);

const routes = new Set([
  "POST /auth/register", "POST /auth/login", "GET /me", "PATCH /me",
  "GET /customers", "POST /customers", "PATCH /customers/:id/status",
  "DELETE /customers/:id", "POST /feedback", "PATCH /feedback/:id/status",
  "POST /surveys", "POST /surveys/:id/publish", "GET /me/surveys",
  "POST /me/surveys/:id/submit", "POST /surveys/:id/close", "GET /reports"
]);

createServer((request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:4173");

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200);
    response.end(JSON.stringify({ service: "milktea-coffee-api", status: "ok" }));
    return;
  }

  response.writeHead(501);
  response.end(JSON.stringify({
    message: "Endpoint đang chờ triển khai",
    contracts: [...routes]
  }));
}).listen(port, "127.0.0.1", () => {
  console.log(`milktea-coffee API đang chạy tại http://localhost:${port}`);
});
