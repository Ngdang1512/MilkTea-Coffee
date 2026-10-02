# milktea-coffee
Hệ thống CRM quản lý và chăm sóc khách hàng cho chuỗi trà sữa/cà phê

## Cấu trúc chính

- `frontend/`: giao diện responsive cho Admin, Manager và Customer.
- `api/`: REST API PHP/PDO, xác thực và phân quyền nghiệp vụ.
- `database/`: PostgreSQL schema, business rules, dữ liệu demo và báo cáo.
- `CRM_TraSua_CaPhe/`: báo cáo phân tích, tài liệu và sơ đồ thiết kế.

Chạy giao diện từ thư mục gốc:

```sh
cd frontend
npm run dev
```

- Admin: `http://127.0.0.1:4173/`
- Manager: `http://127.0.0.1:4174/`
- Customer: `http://127.0.0.1:4175/`

Chạy API ở terminal khác:

```sh
cd api
/Applications/XAMPP/xamppfiles/bin/php -S 127.0.0.1:3000 -t public public/index.php
```
