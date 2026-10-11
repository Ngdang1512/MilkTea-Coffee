# Frontend

Frontend JavaScript thuần, không cần Apache. Chạy API Node.js và PostgreSQL theo hướng dẫn ở [README.md](../README.md), sau đó trong PowerShell:

```powershell
cd C:\xampp\htdocs\MilkTea-Coffee\frontend
npm run dev
```

Mở cổng `4173` theo từng khu vực:

- Admin: http://127.0.0.1:4173/admin
- Manager: http://127.0.0.1:4173/manager
- Customer: http://127.0.0.1:4173/customer

API base URL mặc định là `http://127.0.0.1:3000`. Nếu đổi cổng hoặc host, cần cập nhật `frontend/configs/app-config.js` và `FRONTEND_ORIGINS` trong `api/.env` cho khớp.
