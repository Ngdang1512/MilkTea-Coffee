# milktea-coffee API

Backend REST viết bằng PHP 8.1+ và PDO PostgreSQL. API chịu trách nhiệm xác thực phiên, phân quyền theo vai trò, validation và transaction; frontend không kết nối trực tiếp PostgreSQL.

```sh
cd api
cp .env.example .env
# Sửa DB_PASSWORD và AUTH_SECRET trong .env
php -S 127.0.0.1:3000 -t public public/index.php
```

Endpoint kiểm tra: `GET http://localhost:3000/health`.

### Chạy bằng XAMPP trên macOS

XAMPP 8.2 đã có sẵn PDO PostgreSQL. Không cần bật MySQL/MariaDB của XAMPP; chỉ dùng PHP của XAMPP để kết nối PostgreSQL 16:

```sh
cd api
/Applications/XAMPP/xamppfiles/bin/php -m | grep -i pdo_pgsql
/Applications/XAMPP/xamppfiles/bin/php -S 127.0.0.1:3000 -t public public/index.php
```

Trong `.env`, dùng `DB_DSN=pgsql:host=localhost;port=5432;dbname=crm_tra_sua_ca_phe`. PostgreSQL phải đang nhận kết nối tại `localhost:5432`.
`FRONTEND_ORIGINS` cho phép ba giao diện tách biệt tại `127.0.0.1:4173`, `127.0.0.1:4174` và `127.0.0.1:4175` khi phát triển cục bộ.

## Customer API đã triển khai

| Method | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/auth/register` | Tạo tài khoản và hồ sơ trong cùng transaction |
| `POST` | `/auth/login` | Kiểm tra bcrypt, trạng thái và cấp token 8 giờ |
| `GET` | `/catalogs/options` | Sở thích, đồ uống và chi nhánh đang hoạt động |
| `GET` | `/me` | Đọc hồ sơ từ ID trong token |
| `PATCH` | `/me` | Cập nhật hồ sơ của chính khách hàng |
| `GET/POST` | `/me/feedback` | Lịch sử và gửi phản hồi sản phẩm |
| `GET` | `/me/surveys` | Khảo sát đã phân phối cho khách |
| `GET` | `/me/surveys/{id}` | Câu hỏi và lựa chọn của khảo sát |
| `POST` | `/me/surveys/{id}/submit` | Nộp nguyên tử bằng `crm_nop_khao_sat` |

Các endpoint `/me/...` dùng header `Authorization: Bearer <token>`. Backend luôn lấy ID khách hàng từ token và kiểm tra lại trạng thái tài khoản trong PostgreSQL.

## Admin/Manager API

Đăng nhập nội bộ bằng `POST /internal/auth/login`. Các endpoint còn lại dùng Bearer token và chỉ chấp nhận vai trò `admin` hoặc `manager`:

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/internal/me` | Tài khoản và quyền hiện tại |
| `GET` | `/internal/dashboard` | Chỉ số tổng hợp từ PostgreSQL |
| `GET` | `/internal/customers` | Danh sách khách hàng |
| `GET/PATCH` | `/internal/feedback[/{id}]` | Danh sách và xử lý phản hồi |
| `GET/POST` | `/internal/surveys` | Tiến độ hoặc tạo và phát hành khảo sát hàng loạt |
| `GET` | `/internal/accounts` | Tài khoản nội bộ, chỉ dành cho Admin |
| `GET` | `/internal/branches` | Danh sách chi nhánh |
| `GET` | `/internal/catalogs` | Đồ uống và nhóm sở thích |

Tài khoản demo: `admin` hoặc `quanly`, mật khẩu `DemoCRM@2026`.

Khi khảo sát được phát hành, hệ thống tạo thông báo cho toàn bộ khách hàng nhận khảo sát. Khách đọc thông báo qua `GET /me/notifications` và đánh dấu đã đọc bằng `PATCH /me/notifications/{id}`. Khi Admin/Manager trả lời một đánh giá, nội dung trả lời cũng được gửi thành thông báo cho đúng khách hàng.

## Cấu trúc hiện tại

```text
src/
├── Auth.php               # Bcrypt và token HMAC
├── Config.php             # Đọc biến môi trường
├── CustomerController.php # Auth, hồ sơ, phản hồi và khảo sát Customer
├── Database.php           # PDO PostgreSQL
├── Http.php               # JSON, validation và error mapping
└── bootstrap.php          # Autoload class

public/
└── index.php              # Front controller, routing và CORS
```
