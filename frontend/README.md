# Cấu trúc frontend

```text
frontend/
├── admin/                 # Route, guard và phần mở rộng riêng của quản trị
├── configs/               # Cấu hình ứng dụng và địa chỉ API
├── extends/               # Lớp nền có thể kế thừa
├── libraries/             # Logic UI, router và tiện ích dùng chung
├── models/                # Model và dữ liệu phía giao diện
├── views/
│   ├── admin/             # Entry page Manager/Admin
│   ├── manager/           # Entry page Manager
│   └── front/             # Entry page Customer
├── templates/
│   ├── admin/             # CSS/tài nguyên giao diện quản trị
│   └── front/             # CSS/tài nguyên giao diện khách hàng
└── userfiles/             # Tệp người dùng tải lên trong tương lai
```

Chạy `npm run dev`, sau đó mở:

- Admin: `http://127.0.0.1:4173/`
- Manager: `http://127.0.0.1:4174/`
- Customer: `http://127.0.0.1:4175/`

Mỗi cổng dùng đường dẫn và phiên đăng nhập riêng, vì vậy có thể mở đồng thời trên nhiều tab:

- Admin dùng cổng `4173`.
- Manager dùng cổng `4174`.
- Customer dùng cổng `4175`.

Khu Customer gọi REST API tại `http://localhost:3000`. Cần khởi động `api/` và PostgreSQL trước khi đăng ký, đăng nhập, cập nhật hồ sơ, gửi phản hồi hoặc làm khảo sát.

Khu Admin/Manager cũng gọi API này và yêu cầu đăng nhập nội bộ. Dữ liệu dashboard, khách hàng, phản hồi, khảo sát, tài khoản và danh mục được đọc trực tiếp từ PostgreSQL. Tài khoản demo: `admin` hoặc `quanly`, mật khẩu `DemoCRM@2026`.
