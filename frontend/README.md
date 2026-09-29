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

- Admin: `http://localhost:4173/` hoặc `/admin`
- Manager: `http://localhost:4173/manager`
- Customer: `http://localhost:4173/customer`
