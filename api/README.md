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
`FRONTEND_ORIGINS` cho phép cả `http://localhost:4173` và `http://127.0.0.1:4173` khi phát triển cục bộ.

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
