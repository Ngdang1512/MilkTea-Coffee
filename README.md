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

Chạy API trên Windows ở terminal PowerShell khác:

```powershell
cd api
/Applications/XAMPP/xamppfiles/bin/php -S 127.0.0.1:3000 -t public public/index.php
```

<<<<<<< Updated upstream
Đảm bảo PostgreSQL đang chạy và có database `crm_tra_sua_ca_phe`. Nếu tài khoản PostgreSQL chưa có mật khẩu, đặt mật khẩu cho tài khoản đó trước rồi nhập cùng giá trị vào `DB_PASSWORD`.
=======
Giữ cửa sổ này mở, sau đó truy cập:

- Admin: http://127.0.0.1:4173/admin
- Manager: http://127.0.0.1:4173/manager
- Customer: http://127.0.0.1:4173/customer

Đăng nhập bằng tài khoản demo ở trên. Admin mới cần migration 10; nếu chưa chạy migration, các trang quản trị mới sẽ báo thiếu cấu trúc database. Để chạy ứng dụng, cần giữ cả hai cửa sổ PowerShell (API và frontend) mở. XAMPP/Apache và MySQL không cần bật; pgAdmin chỉ dùng để quản lý PostgreSQL.

## Khắc phục lỗi

- API không khởi động: xem lỗi trong PowerShell; kiểm tra PostgreSQL đang chạy, `DB_PASSWORD`, database và extension/package PostgreSQL (API Node.js dùng package `pg`, không dùng PHP của XAMPP).
- `/health` báo lỗi: API chưa kết nối được PostgreSQL; kiểm tra PostgreSQL đang chạy, host/cổng trong `DB_DSN` (mặc định `localhost:5432`), `DB_PASSWORD` và database `crm_tra_sua_ca_phe`.
- Trình duyệt báo `Failed to fetch`: kiểm tra cả API lẫn frontend đang chạy; mở đúng URL `http://127.0.0.1:4173` và xác nhận `FRONTEND_ORIGINS` trong `api/.env` có địa chỉ này.
- Báo thiếu bảng/cột hoặc cấu trúc database: kiểm tra đã chạy `07_notifications_and_replies.sql` rồi `10_admin_governance.sql` trên đúng database chưa. Hướng dẫn chi tiết: [database/README.md](database/README.md).

Chi tiết API: [api/README.md](api/README.md).

Nếu tạo database mới, chạy theo thứ tự:
CRM_Create_All.sql
07_notifications_and_replies.sql
10_admin_governance.sql

Nếu pgAdmin báo lỗi, chạy ROLLBACK; để thoát transaction lỗi, rồi xử lý lỗi đầu tiên trong tab Messages trước khi chạy lại.
>>>>>>> Stashed changes
