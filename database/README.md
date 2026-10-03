# milktea-coffee database

PostgreSQL dùng chung cho toàn hệ thống. Thư mục gồm schema, business rules, dữ liệu demo, report views, ví dụ sử dụng và script kiểm tra.

Thứ tự chạy thủ công:

1. `00_create_database.sql`
2. `01_schema.sql`
3. `02_business_rules.sql`
4. `03_demo_data.sql`
5. `04_reports.sql`
6. `07_notifications_and_replies.sql`
7. `06_verify.sql`

Hoặc kết nối vào database trống và chạy `CRM_Create_All.sql` một lần.

Nếu database đã được tạo trước khi bổ sung thông báo, chạy `07_notifications_and_replies.sql` một lần trước khi dùng API gửi trả lời phản hồi, phát hành khảo sát hoặc đọc thông báo. Script này có thể chạy lại an toàn.

Nếu database đã được tạo trước khi loại bỏ chi nhánh, chạy `08_remove_branches.sql` một lần để gỡ các cột và bảng cũ mà không xóa tài khoản, khách hàng hay nội dung phản hồi. Database cũ cần áp dụng cả hai script nâng cấp `07_notifications_and_replies.sql` và `08_remove_branches.sql`; chúng xử lý các thay đổi khác nhau.

Nếu database đã được tạo trước khi bổ sung sửa/ẩn khảo sát, chạy `09_survey_management.sql` một lần sau khi đã có các bảng và hàm khảo sát. Script thêm cờ ẩn mềm và cập nhật quy tắc để cho phép sửa câu hỏi khi chưa có phản hồi hoàn thành; các phản hồi và lịch sử phân phối hiện có được giữ nguyên. Không cần chạy script nâng cấp này trên database mới được tạo từ `CRM_Create_All.sql`.

## Chạy migration sửa/ẩn khảo sát trên Windows

Nếu database hiện tại chưa có bảng `thong_bao`, trước tiên chạy migration `07_notifications_and_replies.sql` để tạo bảng này. Sau đó chạy `09_survey_management.sql`. Trong PowerShell, đặt encoding UTF-8 rồi chạy lần lượt (đổi `-U` hoặc `-d` nếu tên tài khoản/database của bạn khác):

```powershell
$env:PGCLIENTENCODING = "UTF8"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
& $psql -h localhost -p 5432 -U postgres -d crm_tra_sua_ca_phe -W -v ON_ERROR_STOP=1 -f "C:\xampp\htdocs\MilkTea-Coffee\database\07_notifications_and_replies.sql"
if ($LASTEXITCODE -ne 0) { throw "Migration 07 thất bại; chưa chạy migration 09." }
& $psql -h localhost -p 5432 -U postgres -d crm_tra_sua_ca_phe -W -v ON_ERROR_STOP=1 -f "C:\xampp\htdocs\MilkTea-Coffee\database\09_survey_management.sql"
if ($LASTEXITCODE -ne 0) { throw "Migration 09 thất bại." }
```

`PGCLIENTENCODING=UTF8` giúp `psql` đọc đúng tiếng Việt trong file SQL. `-W` yêu cầu nhập mật khẩu PostgreSQL; đây không phải mật khẩu tài khoản demo của ứng dụng. Nếu PostgreSQL được cài ở vị trí khác, thay đường dẫn tới `psql.exe` bằng file trong thư mục `bin` của PostgreSQL (ví dụ `C:\Program Files\PostgreSQL\<phiên-bản>\bin\psql.exe`). Không dùng `CRM_Create_All.sql` cho database đang hoạt động vì đây là script khởi tạo database mới.

Có thể chạy thay thế trong pgAdmin: chọn đúng database `crm_tra_sua_ca_phe`, mở **Query Tool**, mở rồi chạy `07_notifications_and_replies.sql` trước; sau đó mở và chạy `09_survey_management.sql`. Migration hoàn tất khi không có lỗi và mỗi script kết thúc bằng `COMMIT`.
