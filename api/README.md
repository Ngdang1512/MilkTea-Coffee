# milktea-coffee API

Backend REST dùng chung cho giao diện Manager và Customer. API chịu trách nhiệm xác thực phiên, phân quyền theo vai trò, validation và transaction; frontend không được kết nối trực tiếp PostgreSQL.

```sh
cd api
npm run dev
```

Endpoint kiểm tra: `GET http://localhost:3000/health`.

## Cấu trúc triển khai tiếp theo

```text
src/
├── modules/        # auth, customers, feedback, surveys, reports, admin
├── middleware/     # session, RBAC, validation và rate limit
├── repositories/   # Truy vấn PostgreSQL có tham số
├── config/         # Biến môi trường và kết nối
└── server.js       # HTTP entrypoint
```
