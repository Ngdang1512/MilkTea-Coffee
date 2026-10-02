# milktea-coffee database

PostgreSQL dùng chung cho toàn hệ thống. Thư mục gồm schema, business rules, dữ liệu demo, report views, ví dụ sử dụng và script kiểm tra.

Thứ tự chạy thủ công:

1. `00_create_database.sql`
2. `01_schema.sql`
3. `02_business_rules.sql`
4. `03_demo_data.sql`
5. `04_reports.sql`
6. `06_verify.sql`
7. `07_notifications_and_replies.sql`

Hoặc kết nối vào database trống và chạy `CRM_Create_All.sql` một lần.
