# milktea-coffee
Hệ thống CRM quản lý và chăm sóc khách hàng cho chuỗi trà sữa/cà phê

## Cấu trúc chính

- `frontend/`: giao diện responsive cho Manager và Customer.
- `api/`: REST API dùng chung, xác thực và phân quyền nghiệp vụ.
- `database/`: PostgreSQL schema, business rules, dữ liệu demo và báo cáo.
- `CRM_TraSua_CaPhe/`: báo cáo phân tích, tài liệu và sơ đồ thiết kế.

Chạy giao diện từ thư mục gốc:

```sh
cd frontend
npm run dev
```

- Admin: `http://localhost:4173/admin`
- Manager: `http://localhost:4173/manager`
- Customer: `http://localhost:4173/customer`

Chạy API trên Windows ở terminal PowerShell khác:

```powershell
cd api
Copy-Item .env.example .env
notepad .env
```

Trong `api/.env`, thay `DB_PASSWORD` bằng mật khẩu PostgreSQL bạn đã đặt khi cài đặt (tài khoản mặc định trong cấu hình là `postgres`). Đây là mật khẩu PostgreSQL, không phải mật khẩu tài khoản demo `DemoCRM@2026`. Lưu file `.env`, sau đó chạy API:

```powershell
& "C:\xampp\php\php.exe" -S 127.0.0.1:3000 -t public public/index.php
```

Đảm bảo PostgreSQL đang chạy và có database `crm_tra_sua_ca_phe`. Nếu tài khoản PostgreSQL chưa có mật khẩu, đặt mật khẩu cho tài khoản đó trước rồi nhập cùng giá trị vào `DB_PASSWORD`.
