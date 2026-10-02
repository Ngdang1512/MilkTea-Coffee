import { APP_CONFIG } from "../configs/app-config.js";
import { customerApi, internalApi } from "./api-client.js";

const customerSession = { profile: null, options: null, currentSurvey: null, questionIndex: 0, answers: [], notifications: [] };
const internalSession = { account: null, dashboard: null, customers: [], feedback: [], surveys: [], accounts: [], branches: [], catalogs: null, loaded: new Set() };
const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
const initials = name => String(name || "?").trim().split(/\s+/).slice(-2).map(word => word[0]).join("").toUpperCase();
const formatDate = value => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const statusLabel = value => ({ active: "Hoạt động", locked: "Đã khóa", moi: "Mới", da_xem: "Đã xem", da_tiep_thu: "Đã tiếp thu", nhap: "Bản nháp", dang_mo: "Đang mở", da_dong: "Đã đóng", admin: "Quản trị viên", manager: "Manager", staff: "Nhân viên" })[value] || value;

const icons = { up: "↗", down: "↘" };
const metric = (label, value, delta, note, color, direction = "up") => `<article class="metric-card"><div class="metric-head"><span class="metric-icon ${color}">${color === "green" ? "♧" : color === "amber" ? "◌" : color === "blue" ? "✓" : "☆"}</span><button>•••</button></div><p>${label}</p><div class="metric-value">${value}</div><footer><span class="${direction}">${icons[direction]} ${delta}</span><small>${note}</small></footer></article>`;

function dashboard() {
  const data = internalSession.dashboard;
  const summary = data?.summary || {};
  const rows = data?.recentCustomers || [];
  return `<section class="page-heading"><div><p class="eyebrow">THỨ BA, 29 THÁNG 09</p><h1>Chào buổi sáng, Quản Lý! <span>👋</span></h1><p>Đây là những gì đang diễn ra tại milktea-coffee hôm nay.</p></div><button class="date-button">▣ &nbsp; 01/09 — 29/09/2026⌄</button></section>
  <section class="metrics">${metric("Tổng khách hàng", summary.totalCustomers ?? "…", "", `${summary.activeCustomers ?? 0} đang hoạt động`, "green")}${metric("Phản hồi mới", summary.newFeedback ?? "…", "", `${summary.totalFeedback ?? 0} phản hồi`, "amber")}${metric("Khảo sát", summary.totalSurveys ?? "…", "", "trên hệ thống", "blue")}${metric("Điểm hài lòng", summary.averageRating ?? "…", "", "trên thang 5 điểm", "rose")}</section>
  <section class="dashboard-grid">
    <article class="panel chart-panel"><div class="panel-title"><div><h2>Tăng trưởng khách hàng</h2><p>Khách hàng mới trong 6 tháng gần nhất</p></div><div class="legend"><i></i> Khách hàng mới <select><option>6 tháng</option><option>12 tháng</option></select></div></div><div class="chart"><div class="y-axis"><span>600</span><span>450</span><span>300</span><span>150</span><span>0</span></div><div class="plot"><i style="--h:45%"><b>Thg 4</b></i><i style="--h:55%"><b>Thg 5</b></i><i style="--h:49%"><b>Thg 6</b></i><i style="--h:66%"><b>Thg 7</b></i><i style="--h:75%"><b>Thg 8</b></i><i class="current" style="--h:91%"><em>548</em><b>Thg 9</b></i></div></div></article>
    <article class="panel satisfaction"><div class="panel-title"><div><h2>Mức độ hài lòng</h2><p>Tổng hợp 1.642 lượt đánh giá</p></div><button>•••</button></div><div class="donut-wrap"><div class="donut"><div><strong>4,7</strong><span>★★★★★</span><small>Rất tốt</small></div></div><div class="rating-list"><p><i class="good"></i><span>Rất hài lòng</span><strong>68%</strong></p><p><i class="okay"></i><span>Hài lòng</span><strong>22%</strong></p><p><i class="neutral"></i><span>Bình thường</span><strong>7%</strong></p><p><i class="bad"></i><span>Chưa hài lòng</span><strong>3%</strong></p></div></div></article>
  </section>
  <section class="panel recent"><div class="panel-title"><div><h2>Khách hàng gần đây</h2><p>Những hồ sơ vừa được cập nhật</p></div><button class="text-button" data-view="customers">Xem tất cả →</button></div>${customerTable(rows)}</section>`;
}

function customerTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Mã thành viên</th><th>Tuổi</th><th>Sở thích</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>${rows.map(c => `<tr><td><div class="customer"><span class="avatar">${initials(c.name)}</span><div><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.username || "Khách hàng CRM")}</small></div></div></td><td><code>${escapeHtml(c.code)}</code></td><td>${c.age}</td><td>${escapeHtml(c.preference)}</td><td><span class="status ${c.status === "locked" ? "locked" : "active"}"><i></i>${statusLabel(c.status)}</span></td><td class="muted">${formatDate(c.updatedAt)}</td></tr>`).join("")}</tbody></table></div>`;
}

function customersView() {
  const rows = internalSession.customers;
  return `<section class="page-heading compact"><div><p class="eyebrow">KHÁCH HÀNG</p><h1>Quản lý khách hàng</h1><p>Tìm kiếm, theo dõi hồ sơ và sở thích trên toàn chuỗi.</p></div></section><section class="panel list-panel"><div class="list-toolbar"><label class="list-search">⌕<input id="customerSearch" placeholder="Tìm theo tên, mã thành viên..." /></label></div><div id="customerResults">${customerTable(rows)}</div><footer class="pagination"><span>Hiển thị ${rows.length} khách hàng từ database</span></footer></section>`;
}

function feedbackView() {
  const items = internalSession.feedback;
  const newCount = items.filter(item => item.status === "moi").length;
  return `<section class="page-heading compact"><div><p class="eyebrow">CHĂM SÓC KHÁCH HÀNG</p><h1>Phản hồi</h1><p>Lắng nghe và xử lý ý kiến khách hàng kịp thời.</p></div></section><div class="segmented"><button class="active">Tất cả <b>${items.length}</b></button><button>Mới <b>${newCount}</b></button></div><section class="feedback-list">${items.map(item => `<article class="feedback-card"><div class="avatar mint">${initials(item.customerName)}</div><div class="feedback-body"><div><strong>${escapeHtml(item.customerName)}</strong><span>• ${escapeHtml(item.drinkName)}</span></div><div class="stars">${"★".repeat(item.rating)}${"☆".repeat(5-item.rating)}</div><p>“${escapeHtml(item.content)}”</p>${item.reply ? `<div class="form-note"><strong>Đã trả lời:</strong> ${escapeHtml(item.reply)}</div>` : ""}<small>${escapeHtml(item.branchName || "Phản hồi chung")} · ${formatDate(item.sentAt)}</small></div><div class="feedback-actions"><span class="status ${item.status === "moi" ? "new" : "active"}">${statusLabel(item.status)}</span>${item.status === "moi" ? `<button class="outline feedback-update" data-feedback-id="${item.id}" data-status="da_xem">Trả lời khách hàng</button>` : item.status === "da_xem" ? `<button class="outline feedback-update" data-feedback-id="${item.id}" data-status="da_tiep_thu">Phản hồi & tiếp thu</button>` : ""}</div></article>`).join("")}</section>`;
}

function surveysView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">KHẢO SÁT</p><h1>Khảo sát khách hàng</h1><p>Theo dõi dữ liệu phân phối và tỷ lệ hoàn thành.</p></div><button class="primary" data-view="create-survey">＋ Tạo khảo sát hàng loạt</button></section><section class="survey-grid">${internalSession.surveys.map(s => `<article class="panel survey-card"><div class="survey-top"><span class="survey-icon">${s.status === "nhap" ? "✎" : "✓"}</span><span class="status ${s.status === "dang_mo" ? "active" : s.status === "nhap" ? "draft" : "locked"}">${statusLabel(s.status)}</span></div><h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.description || "Không có mô tả")}</p><div class="survey-stats"><div><small>Người nhận</small><strong>${s.recipients}</strong></div><div><small>Hoàn thành</small><strong>${s.completionRate}%</strong></div><div><small>Hạn trả lời</small><strong>${formatDate(s.endAt)}</strong></div></div></article>`).join("")}</section>`;
}

function createSurveyView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">KHẢO SÁT HÀNG LOẠT</p><h1>Tạo khảo sát đánh giá</h1><p>Khảo sát sẽ được phát hành và thông báo đến toàn bộ khách hàng đang hoạt động.</p></div></section><form class="panel profile-form" id="bulkSurveyForm"><div class="form-grid"><label>Tiêu đề *<input name="title" minlength="3" maxlength="255" required /></label><label>Hạn trả lời *<input name="endAt" type="datetime-local" required /></label></div><label>Mô tả<textarea name="description" rows="3"></textarea></label><div class="form-heading"><h2>Câu hỏi đánh giá</h2><p>Mỗi dòng lựa chọn ngăn cách bằng dấu chấm phẩy.</p></div><div id="surveyQuestions"><div class="form-grid survey-question-input"><label>Câu hỏi *<input name="question" required /></label><label>Các lựa chọn *<input name="choices" placeholder="Rất hài lòng; Hài lòng; Bình thường; Chưa hài lòng" required /></label></div></div><footer><button type="button" class="outline" id="addSurveyQuestion">＋ Thêm câu hỏi</button><button class="primary" type="submit">Phát hành và thông báo</button></footer></form>`;
}

function notificationsView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">THÔNG BÁO</p><h1>Thông báo của tôi</h1><p>Khảo sát mới và trả lời từ đội ngũ chăm sóc khách hàng.</p></div></section><section class="survey-list">${customerSession.notifications.length ? customerSession.notifications.map(item => `<article class="panel my-survey ${item.read ? "" : "featured"}"><div class="survey-number ${item.read ? "done" : ""}">${item.type === "survey" ? "✓" : "♡"}</div><div><span class="status ${item.read ? "locked" : "active"}">${item.read ? "Đã đọc" : "Mới"}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.content)} · ${formatDate(item.createdAt)}</p></div>${item.link ? `<button class="outline notification-open" data-id="${item.id}" data-link="${escapeHtml(item.link)}">Xem →</button>` : ""}</article>`).join("") : `<article class="panel empty-state"><span>♢</span><h2>Chưa có thông báo</h2></article>`}</section>`;
}

function adminDashboard() {
  const summary = internalSession.dashboard?.summary || {};
  return `<section class="admin-heading"><div><p class="eyebrow">QUẢN TRỊ HỆ THỐNG</p><h1>Dashboard</h1><p>Theo dõi hoạt động toàn chuỗi milktea-coffee tại một nơi.</p></div><div class="admin-heading-actions"><button class="outline action-toast">⇩ Xuất báo cáo</button><button class="primary action-toast">＋ Thêm tài khoản</button></div></section>
  <section class="admin-kpis"><article class="admin-kpi featured"><div><p>Khách hàng hoạt động</p><span>↗</span></div><strong>${summary.activeCustomers ?? "…"}</strong><small>${summary.totalCustomers ?? 0} tổng khách hàng CRM</small></article><article class="admin-kpi"><div><p>Phản hồi</p><span>↗</span></div><strong>${summary.totalFeedback ?? "…"}</strong><small>${summary.newFeedback ?? 0} phản hồi mới</small></article><article class="admin-kpi"><div><p>Điểm hài lòng</p><span>↗</span></div><strong>${summary.averageRating ?? "…"}</strong><small>Trung bình trên thang 5 điểm</small></article><article class="admin-kpi"><div><p>Khảo sát</p><span>↗</span></div><strong>${summary.totalSurveys ?? "…"}</strong><small>Khảo sát trong database</small></article></section>
  <section class="admin-board"><article class="panel admin-analytics"><div class="panel-title"><div><h2>Phản hồi trong tuần</h2><p>Lượng ý kiến khách hàng theo ngày gửi</p></div><button class="mini-filter">Tuần này⌄</button></div><div class="admin-bars"><div style="--v:42%"><i></i><b>T2</b></div><div style="--v:68%"><i></i><b>T3</b></div><div class="highlight" style="--v:82%"><em>18</em><i></i><b>T4</b></div><div style="--v:58%"><i></i><b>T5</b></div><div class="coffee" style="--v:90%"><i></i><b>T6</b></div><div style="--v:63%"><i></i><b>T7</b></div><div style="--v:35%"><i></i><b>CN</b></div></div><footer><span><i class="matcha-dot"></i>Đã xử lý</span><span><i class="coffee-dot"></i>Cần theo dõi</span><strong>86 phản hồi tuần này</strong></footer></article>
  <article class="panel admin-reminder"><div class="panel-title"><div><h2>Nhắc việc</h2><p>Hôm nay, 01 tháng 10</p></div><span class="live-dot"></span></div><span class="reminder-icon">☕</span><h3>Kiểm tra dữ liệu sao lưu</h3><p>Xác nhận bản sao lưu PostgreSQL và kiểm tra nhật ký hệ thống.</p><button class="primary action-toast">✓ Đánh dấu hoàn tất</button></article>
  <article class="panel admin-shortcuts"><div class="panel-title"><div><h2>Quản lý nhanh</h2><p>Danh mục hệ thống</p></div><button class="tiny-add action-toast">＋ Mới</button></div><button data-view="accounts"><span class="shortcut-icon matcha">♧</span><div><strong>Tài khoản nội bộ</strong><small>24 tài khoản · 3 vai trò</small></div><b>→</b></button><button data-view="branches"><span class="shortcut-icon latte">⌖</span><div><strong>Chi nhánh</strong><small>8 địa điểm hoạt động</small></div><b>→</b></button><button data-view="admin-catalog"><span class="shortcut-icon tea">◇</span><div><strong>Đồ uống</strong><small>42 sản phẩm kinh doanh</small></div><b>→</b></button><button data-view="admin-catalog"><span class="shortcut-icon berry">♡</span><div><strong>Nhóm sở thích</strong><small>4 nhóm đang sử dụng</small></div><b>→</b></button></article>
  <article class="panel admin-team"><div class="panel-title"><div><h2>Hoạt động gần đây</h2><p>Cập nhật bởi đội ngũ quản trị</p></div><button class="outline action-toast">Xem tất cả</button></div><div class="team-row"><span class="avatar mint">QA</span><div><strong>Nguyễn Quản Lý</strong><small>Đã xử lý 8 phản hồi khách hàng</small></div><time>10 phút trước</time><span class="status active">Hoàn tất</span></div><div class="team-row"><span class="avatar peach">TH</span><div><strong>Trần Thu Hương</strong><small>Đã phát hành khảo sát tháng 10</small></div><time>35 phút trước</time><span class="status active">Đã phát hành</span></div><div class="team-row"><span class="avatar blue">AD</span><div><strong>System Admin</strong><small>Đã tạo tài khoản nv.hoang</small></div><time>1 giờ trước</time><span class="status draft">Đã cập nhật</span></div></article>
  <article class="panel admin-progress"><div class="panel-title"><div><h2>Tình trạng hệ thống</h2><p>Cập nhật theo thời gian thực</p></div><span class="status active"><i></i>Ổn định</span></div><div class="progress-ring"><div><strong>99,9%</strong><small>Uptime</small></div></div><footer><span><i class="matcha-dot"></i>Hoạt động</span><span><i class="pending-dot"></i>Bảo trì</span></footer></article>
  <article class="admin-promo"><span>✦ MILKTEA-COFFEE</span><h2>Dữ liệu sạch.<br/>Chăm sóc tốt hơn.</h2><p>Sao lưu gần nhất lúc 03:00 hôm nay.</p><button data-view="settings">Xem cấu hình →</button></article></section>`;
}

function accountsView() {
  const rows = internalSession.accounts;
  return `<section class="page-heading compact"><div><p class="eyebrow">QUẢN TRỊ</p><h1>Tài khoản nội bộ</h1><p>Tài khoản và quyền truy cập đang lưu trong PostgreSQL.</p></div></section><section class="panel list-panel"><div class="table-wrap"><table><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Chi nhánh</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>${rows.map(r=>`<tr><td><div class="customer"><span class="avatar mint">${initials(r.username)}</span><strong>${escapeHtml(r.username)}</strong></div></td><td><span class="role-badge">${statusLabel(r.role)}</span></td><td>${escapeHtml(r.branchName || "Toàn hệ thống")}</td><td><span class="status ${r.status === "locked" ? "locked" : "active"}"><i></i>${statusLabel(r.status)}</span></td><td class="muted">${formatDate(r.createdAt)}</td></tr>`).join("")}</tbody></table></div><footer class="pagination"><span>Hiển thị ${rows.length} tài khoản nội bộ</span></footer></section>`;
}

function internalLoginView() {
  const portalName = internalApi.portal === "admin" ? "Admin" : "Manager";
  const demoAccount = internalApi.portal === "admin" ? "admin" : "quanly";
  return `<section class="auth-shell"><div class="auth-story"><span class="welcome-chip">CỔNG ${portalName.toUpperCase()} CRM</span><h1>Quản lý dữ liệu<br/>toàn chuỗi.</h1><p>Đăng nhập bằng tài khoản ${portalName} để truy cập dữ liệu thật.</p></div><form class="auth-card" id="internalLoginForm"><div class="form-heading"><p class="eyebrow">KHU VỰC ${portalName.toUpperCase()}</p><h2>Đăng nhập</h2><p>Phiên làm việc được phân quyền tại API.</p></div><label>Tên đăng nhập<input name="tenDangNhap" autocomplete="username" required /></label><label>Mật khẩu<input name="matKhau" type="password" autocomplete="current-password" required /></label><div class="auth-error" id="internalAuthError" role="alert"></div><button class="primary auth-submit" type="submit">Đăng nhập →</button><small>Demo: ${demoAccount} / DemoCRM@2026</small></form></section>`;
}

function branchesView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">DANH MỤC HỆ THỐNG</p><h1>Chi nhánh</h1><p>Địa điểm làm việc lấy trực tiếp từ PostgreSQL.</p></div></section><section class="branch-grid">${internalSession.branches.map(b=>`<article class="panel branch-card"><div><span class="branch-code">${escapeHtml(b.code)}</span></div><span class="status ${b.active ? "active" : "locked"}"><i></i>${b.active ? "Đang hoạt động" : "Ngừng hoạt động"}</span><h2>${escapeHtml(b.name)}</h2><p>⌖ ${escapeHtml(b.address)}</p><footer><span>☎ ${escapeHtml(b.phone || "Chưa cập nhật")}</span></footer></article>`).join("")}</section>`;
}

function adminCatalogView() {
  const catalogs = internalSession.catalogs || { preferences: [], drinks: [] };
  return `<section class="page-heading compact"><div><p class="eyebrow">DANH MỤC HỆ THỐNG</p><h1>Danh mục</h1><p>Nhóm sở thích và đồ uống đang lưu trong PostgreSQL.</p></div></section><section class="catalog-layout"><article class="panel"><div class="panel-title"><div><h2>Nhóm sở thích</h2><p>${catalogs.preferences.length} nhóm</p></div></div>${catalogs.preferences.map((x,i)=>`<div class="catalog-row"><span class="catalog-icon">${i+1}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.description || "Không có mô tả")}</small></div><span class="status ${x.active ? "active" : "locked"}">${x.active ? "Đang dùng" : "Ngừng dùng"}</span></div>`).join("")}</article><article class="panel"><div class="panel-title"><div><h2>Đồ uống</h2><p>${catalogs.drinks.length} sản phẩm</p></div></div>${catalogs.drinks.map(x=>`<div class="catalog-row"><span class="drink-dot green">☕</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.code)}</small></div><span class="status ${x.active ? "active" : "locked"}">${x.active ? "Kinh doanh" : "Ngừng bán"}</span></div>`).join("")}</article></section>`;
}

function loginView() {
  return `<section class="auth-shell"><div class="auth-story"><span class="welcome-chip">MILKTEA-COFFEE CRM</span><h1>Chào mừng bạn<br/>quay trở lại.</h1><p>Đăng nhập để cập nhật sở thích, gửi phản hồi và thực hiện khảo sát dành riêng cho bạn.</p><div class="auth-quote"><span>☕</span><p>“Mỗi góp ý của bạn giúp một ly nước ngày mai ngon hơn.”</p></div></div><form class="auth-card" id="loginForm"><div class="form-heading"><p class="eyebrow">KHU VỰC KHÁCH HÀNG</p><h2>Đăng nhập</h2><p>Sử dụng tài khoản thành viên của bạn.</p></div><label>Tên đăng nhập<input name="tenDangNhap" autocomplete="username" placeholder="Ví dụ: khach01" required /></label><label>Mật khẩu<input name="matKhau" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required /></label><div class="auth-error" id="authError" role="alert"></div><button class="primary auth-submit" type="submit">Đăng nhập →</button><p class="auth-switch">Chưa có tài khoản? <button type="button" data-view="register">Đăng ký thành viên</button></p><small>Tài khoản demo: khach01 / DemoCRM@2026</small></form></section>`;
}

function registerView() {
  return `<section class="auth-shell"><div class="auth-story register-story"><span class="welcome-chip">THÀNH VIÊN MỚI</span><h1>Gia nhập cộng đồng<br/>milktea-coffee.</h1><p>Chia sẻ khẩu vị để chúng tôi hiểu bạn hơn trong mỗi lần ghé.</p><div class="auth-quote"><span>✦</span><p>Tài khoản được dùng chung tại mọi chi nhánh trong chuỗi.</p></div></div><form class="auth-card register-card" id="registerForm"><div class="form-heading"><p class="eyebrow">TẠO TÀI KHOẢN</p><h2>Đăng ký thành viên</h2><p>Điền đầy đủ thông tin bắt buộc bên dưới.</p></div><div class="form-grid"><label>Tên đăng nhập *<input name="tenDangNhap" minlength="3" maxlength="100" required /></label><label>Mật khẩu *<input name="matKhau" type="password" minlength="8" maxlength="128" required /></label><label>Họ và tên *<input name="hoTen" maxlength="150" required /></label><label>Năm sinh *<input name="namSinh" type="number" min="1900" max="${new Date().getFullYear()}" required /></label><label>Giới tính<select name="gioiTinh"><option value="khong_cung_cap">Không cung cấp</option><option value="nam">Nam</option><option value="nu">Nữ</option><option value="khac">Khác</option></select></label><label>Sở thích mặc định *<select name="soThichId" id="registerPreference" required><option value="">Đang tải...</option></select></label></div><div class="auth-error" id="authError" role="alert"></div><button class="primary auth-submit" type="submit">Tạo tài khoản →</button><p class="auth-switch">Đã có tài khoản? <button type="button" data-view="login">Đăng nhập</button></p></form></section>`;
}

function customerHome() {
  const profile = customerSession.profile || { hoTen: "bạn", maThanhVien: "—" };
  return `<section class="customer-hero"><div><span class="welcome-chip">THÀNH VIÊN MILKTEA-COFFEE</span><h1>Xin chào, ${escapeHtml(profile.hoTen)}!</h1><p>Một ngày thật dịu dàng cùng ly trà bạn yêu thích.</p><div class="member-code"><span>Mã thành viên</span><strong>${escapeHtml(profile.maThanhVien)}</strong></div></div><div class="hero-cup" aria-hidden="true"><span>MC</span></div></section>
  <section class="customer-stats"><article><span class="soft-icon">✓</span><div><small>Khảo sát đã hoàn thành</small><strong>06</strong><p>2 khảo sát trong tháng này</p></div></article><article><span class="soft-icon amber">☆</span><div><small>Đánh giá trung bình</small><strong>4,8</strong><p>Cảm ơn những chia sẻ của bạn</p></div></article><article><span class="soft-icon rose">◌</span><div><small>Phản hồi đã gửi</small><strong>12</strong><p>100% đã được tiếp nhận</p></div></article></section>
  <section class="customer-layout"><div><div class="section-title"><div><p class="eyebrow">DÀNH CHO BẠN</p><h2>Khảo sát đang chờ</h2></div><button class="text-button" data-view="my-surveys">Xem tất cả →</button></div><article class="task-card"><div class="task-art">☕</div><div class="task-copy"><span class="status active">Đang mở</span><h3>Mức độ hài lòng tháng 09</h3><p>Chia sẻ trải nghiệm gần nhất của bạn tại milktea-coffee.</p><div class="task-meta"><span>◷ Khoảng 3 phút</span><span>▣ Hạn 30/09/2026</span></div></div><button class="primary" id="startSurvey">Bắt đầu →</button></article></div><aside class="panel quick-actions"><div class="panel-title"><div><h2>Truy cập nhanh</h2><p>Chúng tôi luôn muốn lắng nghe bạn</p></div></div><button data-view="my-feedback"><span>♡</span><div><strong>Gửi phản hồi</strong><small>Chia sẻ trải nghiệm đồ uống</small></div><b>→</b></button><button data-view="profile"><span>♧</span><div><strong>Cập nhật hồ sơ</strong><small>Sở thích và thông tin cá nhân</small></div><b>→</b></button></aside></section>`;
}

function profileView() {
  const p = customerSession.profile || { hoTen: "Đang tải...", tenDangNhap: "", maThanhVien: "—", namSinh: "", gioiTinh: "khong_cung_cap", soThichId: "", ngayTao: null };
  const initials = p.hoTen.split(/\s+/).slice(-2).map(word => word[0]).join("").toUpperCase();
  return `<section class="page-heading compact"><div><p class="eyebrow">TÀI KHOẢN CỦA TÔI</p><h1>Hồ sơ cá nhân</h1><p>Thông tin này giúp chúng tôi mang đến trải nghiệm phù hợp hơn.</p></div></section><section class="profile-layout"><aside class="panel profile-summary"><div class="large-avatar">${escapeHtml(initials)}</div><h2>${escapeHtml(p.hoTen)}</h2><p>@${escapeHtml(p.tenDangNhap)}</p><span class="status active"><i></i>Đang hoạt động</span><dl><div><dt>Mã thành viên</dt><dd>${escapeHtml(p.maThanhVien)}</dd></div><div><dt>Tham gia từ</dt><dd>${p.ngayTao ? new Date(p.ngayTao).toLocaleDateString("vi-VN") : "—"}</dd></div></dl></aside><form class="panel profile-form" id="profileForm"><div class="form-heading"><h2>Thông tin cơ bản</h2><p>Các trường có dấu * là bắt buộc.</p></div><div class="form-grid"><label>Họ và tên *<input name="hoTen" value="${escapeHtml(p.hoTen)}" required /></label><label>Năm sinh *<input name="namSinh" type="number" value="${escapeHtml(p.namSinh)}" min="1900" max="${new Date().getFullYear()}" required /></label><label>Giới tính<select name="gioiTinh"><option value="nam" ${p.gioiTinh === "nam" ? "selected" : ""}>Nam</option><option value="nu" ${p.gioiTinh === "nu" ? "selected" : ""}>Nữ</option><option value="khac" ${p.gioiTinh === "khac" ? "selected" : ""}>Khác</option><option value="khong_cung_cap" ${p.gioiTinh === "khong_cung_cap" ? "selected" : ""}>Không cung cấp</option></select></label><label>Sở thích mặc định *<select name="soThichId" id="profilePreference"><option value="${escapeHtml(p.soThichId)}">${escapeHtml(p.soThich || "Đang tải...")}</option></select></label></div><div class="form-note">✦ Sở thích được dùng để cá nhân hóa khảo sát và gợi ý sản phẩm.</div><footer><button type="button" class="outline" data-view="customer-home">Hủy thay đổi</button><button class="primary" type="submit">Lưu hồ sơ</button></footer></form></section>`;
}

function myFeedbackView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">CHIA SẺ CÙNG CHÚNG TÔI</p><h1>Phản hồi của tôi</h1><p>Mỗi góp ý của bạn đều giúp milktea-coffee tốt hơn mỗi ngày.</p></div></section><section class="customer-layout feedback-layout"><form class="panel feedback-form" id="feedbackForm"><div class="form-heading"><h2>Gửi phản hồi mới</h2><p>Hãy kể cho chúng tôi về trải nghiệm gần nhất.</p></div><label>Đồ uống *<select name="doUongId" id="feedbackDrink" required><option value="">Đang tải...</option></select></label><label>Chi nhánh<select name="chiNhanhId" id="feedbackBranch"><option value="">Phản hồi chung về sản phẩm</option></select></label><fieldset><legend>Mức độ hài lòng *</legend><input type="hidden" name="soSao" id="feedbackRating" required /><div class="star-picker"><button type="button" data-rating="1">★</button><button type="button" data-rating="2">★</button><button type="button" data-rating="3">★</button><button type="button" data-rating="4">★</button><button type="button" data-rating="5">★</button></div></fieldset><label>Nội dung phản hồi *<textarea name="noiDung" rows="5" minlength="10" placeholder="Điều gì khiến bạn hài lòng hoặc chưa hài lòng?" required></textarea><small>Tối thiểu 10 ký tự</small></label><button class="primary" type="submit">Gửi phản hồi</button></form><div><div class="section-title"><div><p class="eyebrow">LỊCH SỬ</p><h2>Phản hồi gần đây</h2></div></div><div id="feedbackHistory"><article class="history-card"><p>Đang tải lịch sử phản hồi...</p></article></div></div></section>`;
}

function mySurveysView() {
  return `<section class="page-heading compact"><div><p class="eyebrow">Ý KIẾN CỦA BẠN</p><h1>Khảo sát của tôi</h1><p>Các khảo sát được gửi riêng đến tài khoản của bạn.</p></div></section><section class="survey-list" id="surveyList"><article class="panel my-survey"><div class="survey-number">…</div><div><h2>Đang tải khảo sát</h2><p>Vui lòng chờ trong giây lát.</p></div></article></section>`;
}

function surveyTakeView() {
  const survey = customerSession.currentSurvey;
  if (!survey) return `<section class="panel empty-state"><span>◷</span><h2>Đang tải khảo sát</h2><p>Vui lòng chờ trong giây lát.</p></section>`;
  const index = customerSession.questionIndex;
  const question = survey.questions[index];
  const saved = customerSession.answers.find(item => item.cauHoiId === question.id)?.luaChonId;
  return `<section class="survey-shell"><header><button class="back-link" data-view="my-surveys">← Quay lại</button><span>Câu ${index + 1} / ${survey.questions.length}</span></header><div class="progress"><i style="width:${((index + 1) / survey.questions.length) * 100}%"></i></div><article class="survey-question"><p class="eyebrow">${escapeHtml(survey.tieuDe).toUpperCase()}</p><h1>${escapeHtml(question.noiDung)}</h1><p>Chọn một phương án phù hợp nhất với trải nghiệm của bạn.</p><div class="answer-list">${question.luaChon.map((choice, choiceIndex) => `<label><input type="radio" name="answer" value="${choice.id}" ${Number(saved) === Number(choice.id) ? "checked" : ""}/><span>${["😍","😊","😐","☕"][choiceIndex] || "◇"}</span><strong>${escapeHtml(choice.noiDung)}</strong><i>○</i></label>`).join("")}</div><footer><small>${question.batBuoc ? "Câu hỏi bắt buộc" : "Có thể bỏ qua"}</small><button class="primary" id="nextQuestion">${index === survey.questions.length - 1 ? "Nộp khảo sát" : "Tiếp tục →"}</button></footer></article></section>`;
}

function placeholder(name, desc) { return `<section class="page-heading compact"><div><p class="eyebrow">MILKTEA-COFFEE</p><h1>${name}</h1><p>${desc}</p></div></section><section class="panel empty-state"><span>✦</span><h2>Khu vực đang được hoàn thiện</h2><p>Cấu trúc màn hình đã sẵn sàng để kết nối endpoint tương ứng trong REST API.</p><button class="primary action-toast">Xem tài liệu API</button></section>`; }

const adminViews = { "internal-login": internalLoginView, "admin-dashboard": adminDashboard, accounts: accountsView, branches: branchesView, "admin-catalog": adminCatalogView, settings: () => placeholder("Cài đặt hệ thống", "Bảo mật, sao lưu và cấu hình vận hành hệ thống.") };
const managerViews = { "internal-login": internalLoginView, dashboard, customers: customersView, feedback: feedbackView, surveys: surveysView, "create-survey": createSurveyView, reports: () => placeholder("Báo cáo & phân tích", "Theo dõi khách hàng, phản hồi và hiệu quả khảo sát.") };
const customerViews = { login: loginView, register: registerView, "customer-home": customerHome, profile: profileView, "my-feedback": myFeedbackView, "my-surveys": mySurveysView, notifications: notificationsView, "take-survey": surveyTakeView };
const titles = { "internal-login": "Đăng nhập nội bộ", "admin-dashboard": "Quản trị", accounts: "Tài khoản nội bộ", branches: "Chi nhánh", "admin-catalog": "Danh mục", dashboard: "Tổng quan", customers: "Khách hàng", feedback: "Phản hồi", surveys: "Khảo sát", "create-survey": "Tạo khảo sát", reports: "Báo cáo", settings: "Cài đặt", login: "Đăng nhập", register: "Đăng ký", "customer-home": "Trang chủ", profile: "Hồ sơ", "my-feedback": "Phản hồi của tôi", "my-surveys": "Khảo sát của tôi", notifications: "Thông báo", "take-survey": "Thực hiện khảo sát" };
const navs = {
  admin: `<p class="nav-label">Quản trị hệ thống</p><button class="nav-item" data-view="admin-dashboard"><span class="icon">⌂</span>Tổng quan</button><button class="nav-item" data-view="accounts"><span class="icon">♧</span>Tài khoản <b id="accountCount">…</b></button><button class="nav-item" data-view="branches"><span class="icon">⌖</span>Chi nhánh</button><button class="nav-item" data-view="admin-catalog"><span class="icon">◇</span>Danh mục</button><p class="nav-label">Vận hành</p><button class="nav-item" data-view="settings"><span class="icon">⚙</span>Cài đặt hệ thống</button>`,
  manager: `<p class="nav-label">Không gian làm việc</p><button class="nav-item" data-view="dashboard"><span class="icon">⌂</span>Tổng quan</button><button class="nav-item" data-view="customers"><span class="icon">♧</span>Khách hàng <b id="customerCount">…</b></button><button class="nav-item" data-view="feedback"><span class="icon">◌</span>Phản hồi <i id="feedbackCount">…</i></button><button class="nav-item" data-view="surveys"><span class="icon">✓</span>Khảo sát</button><button class="nav-item" data-view="reports"><span class="icon">⌁</span>Báo cáo</button>`,
  customer: `<p class="nav-label">Tài khoản của tôi</p><button class="nav-item" data-view="customer-home"><span class="icon">⌂</span>Trang chủ</button><button class="nav-item" data-view="profile"><span class="icon">♧</span>Hồ sơ cá nhân</button><button class="nav-item" data-view="my-feedback"><span class="icon">♡</span>Phản hồi của tôi</button><button class="nav-item" data-view="my-surveys"><span class="icon">✓</span>Khảo sát</button><button class="nav-item" data-view="notifications"><span class="icon">♢</span>Thông báo <i id="notificationCount">0</i></button><p class="nav-label">Hỗ trợ</p><button class="nav-item action-toast"><span class="icon">?</span>Trung tâm trợ giúp</button>`
};
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let currentRole = "manager";
let feedbackSubmitting = false;

function notify(message = "Tính năng đã sẵn sàng để kết nối API") { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }
function formPayload(form) { return Object.fromEntries(new FormData(form).entries()); }
function setFormBusy(form, busy) { const button = form.querySelector("button[type='submit']"); button.disabled = busy; button.textContent = busy ? "Đang xử lý..." : button.dataset.label || button.textContent; }

async function setupCustomerPage(view) {
  if (currentRole !== "customer") return;
  const errorBox = document.querySelector("#authError");
  const showError = error => { if (errorBox) errorBox.textContent = error.message; else notify(error.message); };

  if (view === "register") {
    try {
      customerSession.options ||= await customerApi.options();
      const select = document.querySelector("#registerPreference");
      select.innerHTML = `<option value="">Chọn sở thích</option>${customerSession.options.preferences.map(item => `<option value="${item.id}">${item.tenNhom}</option>`).join("")}`;
    } catch (error) { showError(error); }
  }

  document.querySelector("#loginForm")?.addEventListener("submit", async event => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button[type='submit']"); button.dataset.label = "Đăng nhập →"; setFormBusy(form, true);
    try {
      const data = await customerApi.login(formPayload(form)); customerSession.profile = data.profile;
      notify("Đăng nhập thành công"); applyRole("customer");
    } catch (error) { showError(error); setFormBusy(form, false); }
  });

  document.querySelector("#registerForm")?.addEventListener("submit", async event => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button[type='submit']"); button.dataset.label = "Tạo tài khoản →"; setFormBusy(form, true);
    try {
      const payload = formPayload(form); payload.namSinh = Number(payload.namSinh); payload.soThichId = Number(payload.soThichId);
      const data = await customerApi.register(payload); customerSession.profile = data.profile;
      notify("Đăng ký thành công"); applyRole("customer");
    } catch (error) { showError(error); setFormBusy(form, false); }
  });

  if (!customerApi.hasToken() || ["login", "register"].includes(view)) return;
  try {
    const profileWasMissing = !customerSession.profile;
    if (profileWasMissing) customerSession.profile = (await customerApi.me()).profile;
    const profile = customerSession.profile;
    document.querySelector("#userInitials").textContent = profile.hoTen.split(/\s+/).slice(-2).map(word => word[0]).join("").toUpperCase();
    document.querySelector("#userName").textContent = profile.hoTen;
    document.querySelector("#userRole").textContent = `Khách hàng · ${profile.maThanhVien}`;
    if (profileWasMissing && ["profile", "customer-home"].includes(view)) { render(view); return; }

    if (["profile", "my-feedback"].includes(view)) customerSession.options ||= await customerApi.options();
    if (view === "profile") {
      const select = document.querySelector("#profilePreference");
      select.innerHTML = customerSession.options.preferences.map(item => `<option value="${item.id}" ${Number(profile.soThichId) === Number(item.id) ? "selected" : ""}>${escapeHtml(item.tenNhom)}</option>`).join("");
      document.querySelector("#profileForm").addEventListener("submit", async event => {
        event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button[type='submit']"); button.dataset.label = "Lưu hồ sơ"; setFormBusy(form, true);
        try {
          const payload = formPayload(form); payload.namSinh = Number(payload.namSinh); payload.soThichId = Number(payload.soThichId);
          customerSession.profile = (await customerApi.updateMe(payload)).profile; notify("Đã cập nhật hồ sơ thành công"); render("profile");
        } catch (error) { notify(error.message); setFormBusy(form, false); }
      });
    }

    if (view === "my-feedback") {
      document.querySelector("#feedbackDrink").innerHTML = `<option value="">Chọn đồ uống</option>${customerSession.options.drinks.map(item => `<option value="${item.id}">${escapeHtml(item.tenDoUong)}</option>`).join("")}`;
      document.querySelector("#feedbackBranch").innerHTML = `<option value="">Phản hồi chung về sản phẩm</option>${customerSession.options.branches.map(item => `<option value="${item.id}">${escapeHtml(item.tenChiNhanh)}</option>`).join("")}`;
      const history = (await customerApi.feedback()).feedback;
      document.querySelector("#feedbackHistory").innerHTML = history.length ? history.map(item => `<article class="history-card"><div><strong>${escapeHtml(item.tenDoUong)}</strong><span class="status active">${escapeHtml(item.trangThai === "moi" ? "Mới" : item.trangThai === "da_xem" ? "Đã xem" : "Đã tiếp thu")}</span></div><p>${escapeHtml(item.noiDung)}</p>${item.phanHoiCuaNhanVien ? `<div class="form-note"><strong>Phản hồi từ cửa hàng:</strong> ${escapeHtml(item.phanHoiCuaNhanVien)}</div>` : ""}<small>${"★".repeat(item.soSao)}${"☆".repeat(5-item.soSao)} · ${escapeHtml(item.tenChiNhanh || "Phản hồi chung")} · ${new Date(item.ngayGui).toLocaleDateString("vi-VN")}</small></article>`).join("") : `<article class="history-card"><p>Bạn chưa gửi phản hồi nào.</p></article>`;
      document.querySelectorAll(".star-picker button").forEach((star, index, all) => star.addEventListener("click", () => { document.querySelector("#feedbackRating").value = star.dataset.rating; all.forEach((item, i) => item.classList.toggle("picked", i <= index)); }));
      document.querySelector("#feedbackForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (feedbackSubmitting) return;
        feedbackSubmitting = true;
        const form = event.currentTarget; const payload = formPayload(form); payload.doUongId = Number(payload.doUongId); payload.chiNhanhId = payload.chiNhanhId ? Number(payload.chiNhanhId) : null; payload.soSao = Number(payload.soSao);
        const button = form.querySelector("button[type='submit']"); button.dataset.label = "Gửi phản hồi"; setFormBusy(form, true);
        try { await customerApi.sendFeedback(payload); notify("Cảm ơn bạn! Phản hồi đã được gửi"); feedbackSubmitting = false; render("my-feedback"); }
        catch (error) { feedbackSubmitting = false; notify(error.message); setFormBusy(form, false); }
      });
    }

    if (view === "my-surveys") {
      const surveys = (await customerApi.surveys()).surveys;
      const list = document.querySelector("#surveyList");
      list.innerHTML = surveys.length ? surveys.map((survey, index) => {
        const completed = Boolean(survey.ngayHoanThanh);
        const expired = survey.ngayKetThuc && new Date(survey.ngayKetThuc) <= new Date();
        const available = !completed && !expired && survey.trangThai === "dang_mo";
        const state = completed ? "Đã hoàn thành" : expired || survey.trangThai === "da_dong" ? "Đã đóng" : "Đang mở";
        return `<article class="panel my-survey ${available ? "featured" : ""}"><div class="survey-number ${completed ? "done" : ""}">${completed ? "✓" : String(index + 1).padStart(2,"0")}</div><div><span class="status ${available ? "active" : "locked"}">${state}</span><h2>${escapeHtml(survey.tieuDe)}</h2><p>${survey.soCauHoi} câu hỏi · ${survey.ngayKetThuc ? `Hạn ${new Date(survey.ngayKetThuc).toLocaleDateString("vi-VN")}` : "Không giới hạn thời gian"}</p></div>${available ? `<button class="primary survey-start" data-survey-id="${survey.id}">Thực hiện ngay →</button>` : `<button class="outline" disabled>${completed ? "Đã nộp" : "Không khả dụng"}</button>`}</article>`;
      }).join("") : `<article class="panel empty-state"><span>✓</span><h2>Chưa có khảo sát</h2><p>Khi có khảo sát mới, bạn sẽ thấy tại đây.</p></article>`;
      document.querySelectorAll(".survey-start").forEach(button => button.addEventListener("click", async () => {
        try {
          customerSession.currentSurvey = (await customerApi.survey(button.dataset.surveyId)).survey;
          customerSession.questionIndex = 0; customerSession.answers = []; render("take-survey");
        } catch (error) { notify(error.message); }
      }));
    }

    if (!customerSession.notifications.length || view === "notifications") {
      customerSession.notifications = (await customerApi.notifications()).notifications;
      const unread = customerSession.notifications.filter(item => !item.read).length;
      const count = document.querySelector("#notificationCount");
      if (count) count.textContent = unread;
    }
    if (view === "notifications") {
      document.querySelectorAll(".notification-open").forEach(button => button.addEventListener("click", async () => {
        await customerApi.readNotification(button.dataset.id);
        customerSession.notifications = [];
        render(button.dataset.link);
      }));
    }

    if (view === "take-survey" && customerSession.currentSurvey) {
      document.querySelector("#nextQuestion")?.addEventListener("click", async () => {
        const survey = customerSession.currentSurvey;
        const question = survey.questions[customerSession.questionIndex];
        const selected = document.querySelector("input[name='answer']:checked");
        if (!selected && question.batBuoc) { notify("Vui lòng chọn một câu trả lời"); return; }
        if (selected) {
          customerSession.answers = customerSession.answers.filter(item => item.cauHoiId !== question.id);
          customerSession.answers.push({ cauHoiId: question.id, luaChonId: Number(selected.value) });
        }
        if (customerSession.questionIndex < survey.questions.length - 1) { customerSession.questionIndex += 1; render("take-survey"); return; }
        try {
          await customerApi.submitSurvey(survey.id, customerSession.answers); notify("Nộp khảo sát thành công");
          customerSession.currentSurvey = null; customerSession.questionIndex = 0; customerSession.answers = []; render("my-surveys");
        } catch (error) { notify(error.message); }
      });
    }
  } catch (error) {
    notify(error.message);
    if (error.status === 401) { customerSession.profile = null; customerApi.logout(); applyRole("customer"); }
  }
}

async function setupInternalPage(view) {
  if (currentRole === "customer") return;
  if (view === "internal-login") {
    document.querySelector("#internalLoginForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector("button[type='submit']");
      button.dataset.label = "Đăng nhập →";
      setFormBusy(form, true);
      try {
        const data = await internalApi.login(formPayload(form));
        if (data.account.role !== internalApi.portal) {
          internalApi.logout();
          throw new Error(`Tài khoản này thuộc cổng ${data.account.role === "admin" ? "Admin" : "Manager"}. Vui lòng mở đúng đường dẫn.`);
        }
        internalSession.account = data.account;
        internalSession.loaded.clear();
        currentRole = data.account.role;
        document.body.dataset.role = currentRole;
        notify("Đăng nhập nội bộ thành công");
        applyRole(currentRole);
      } catch (error) {
        document.querySelector("#internalAuthError").textContent = error.message;
        setFormBusy(form, false);
      }
    });
    return;
  }
  if (!internalApi.hasToken()) { render("internal-login"); return; }

  try {
    if (!internalSession.account) internalSession.account = (await internalApi.me()).account;
    if (internalSession.account.role !== internalApi.portal) {
      internalApi.logout();
      internalSession.account = null;
      throw Object.assign(new Error(`Phiên đăng nhập không thuộc cổng ${internalApi.portal === "admin" ? "Admin" : "Manager"}`), { status: 403 });
    }
    const loaders = {
      "admin-dashboard": async () => { internalSession.dashboard = await internalApi.dashboard(); },
      dashboard: async () => { internalSession.dashboard = await internalApi.dashboard(); },
      customers: async () => { internalSession.customers = (await internalApi.customers()).customers; },
      feedback: async () => { internalSession.feedback = (await internalApi.feedback()).feedback; },
      surveys: async () => { internalSession.surveys = (await internalApi.surveys()).surveys; },
      accounts: async () => { internalSession.accounts = (await internalApi.accounts()).accounts; },
      branches: async () => { internalSession.branches = (await internalApi.branches()).branches; },
      "admin-catalog": async () => { internalSession.catalogs = await internalApi.catalogs(); }
    };
    if (loaders[view] && !internalSession.loaded.has(view)) {
      await loaders[view]();
      internalSession.loaded.add(view);
      render(view);
      return;
    }
    if (!internalSession.dashboard) internalSession.dashboard = await internalApi.dashboard();
    const accountCount = document.querySelector("#accountCount");
    const customerCount = document.querySelector("#customerCount");
    const feedbackCount = document.querySelector("#feedbackCount");
    if (accountCount) accountCount.textContent = internalSession.dashboard.summary.totalAccounts;
    if (customerCount) customerCount.textContent = internalSession.dashboard.summary.totalCustomers;
    if (feedbackCount) feedbackCount.textContent = internalSession.dashboard.summary.newFeedback;
    const name = internalSession.account.tenDangNhap;
    document.querySelector("#userInitials").textContent = initials(name);
    document.querySelector("#userName").textContent = name;
    document.querySelector("#userRole").textContent = internalSession.account.role === "admin" ? "Quản trị viên" : `Manager · ${internalSession.account.tenChiNhanh || "Toàn chuỗi"}`;
    document.querySelectorAll(".feedback-update").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const reply = window.prompt("Nhập nội dung phản hồi gửi đến khách hàng (có thể để trống):", "") ?? "";
        await internalApi.updateFeedback(button.dataset.feedbackId, button.dataset.status, reply);
        internalSession.loaded.delete("feedback");
        notify("Đã cập nhật trạng thái phản hồi");
        render("feedback");
      } catch (error) { notify(error.message); button.disabled = false; }
    }));
    if (view === "create-survey") {
      document.querySelector("#addSurveyQuestion").addEventListener("click", () => {
        document.querySelector("#surveyQuestions").insertAdjacentHTML("beforeend", `<div class="form-grid survey-question-input"><label>Câu hỏi *<input name="question" required /></label><label>Các lựa chọn *<input name="choices" placeholder="Lựa chọn 1; Lựa chọn 2" required /></label></div>`);
      });
      document.querySelector("#bulkSurveyForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = formPayload(form);
        const questions = [...form.querySelectorAll(".survey-question-input")].map(row => ({ content: row.querySelector('[name="question"]').value.trim(), choices: row.querySelector('[name="choices"]').value.split(";").map(value => value.trim()).filter(Boolean) }));
        const button = form.querySelector("button[type='submit']");
        button.dataset.label = "Phát hành và thông báo";
        setFormBusy(form, true);
        try {
          const result = await internalApi.createSurvey({ title: payload.title, description: payload.description, endAt: new Date(payload.endAt).toISOString(), questions });
          internalSession.loaded.delete("surveys");
          notify(`Đã gửi khảo sát đến ${result.recipients} khách hàng`);
          render("surveys");
        } catch (error) { notify(error.message); setFormBusy(form, false); }
      });
    }
  } catch (error) {
    notify(error.message);
    if (error.status === 401 || error.status === 403) {
      internalApi.logout();
      internalSession.account = null;
      internalSession.loaded.clear();
      render("internal-login");
    }
  }
}

function render(view = "dashboard") {
  const views = currentRole === "admin" ? adminViews : currentRole === "manager" ? managerViews : customerViews;
  if (!views[view]) view = currentRole === "admin" ? "admin-dashboard" : currentRole === "manager" ? "dashboard" : "customer-home";
  app.innerHTML = views[view](); app.classList.remove("page-enter"); void app.offsetWidth; app.classList.add("page-enter"); document.querySelector("#pageCrumb").textContent = titles[view];
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
  document.querySelector("#sidebar").classList.remove("open"); window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelectorAll("[data-view]").forEach(el => { el.onclick = () => render(el.dataset.view); });
  document.querySelectorAll(".action-toast").forEach(el => { el.onclick = () => notify(); });
  document.querySelector("#addCustomer")?.addEventListener("click", () => notify("Đã mở luồng thêm khách hàng tại quầy"));
  document.querySelector("#customerSearch")?.addEventListener("input", e => { const q = e.target.value.toLowerCase(); const filtered = internalSession.customers.filter(c => `${c.name} ${c.code} ${c.preference}`.toLowerCase().includes(q)); document.querySelector("#customerResults").innerHTML = customerTable(filtered); });
  document.querySelectorAll("#startSurvey").forEach(el => el.addEventListener("click", () => render("my-surveys")));
  setupCustomerPage(view);
  setupInternalPage(view);
}

function applyRole(role) {
  currentRole = role;
  document.body.dataset.role = role;
  const guestNav = `<p class="nav-label">Tài khoản khách hàng</p><button class="nav-item" data-view="login"><span class="icon">→</span>Đăng nhập</button><button class="nav-item" data-view="register"><span class="icon">＋</span>Đăng ký thành viên</button>`;
  const internalGuest = role !== "customer" && !internalApi.hasToken();
  document.querySelector("#mainNav").innerHTML = role === "customer" && !customerApi.hasToken() ? guestNav : internalGuest ? `<p class="nav-label">Khu vực nội bộ</p><button class="nav-item" data-view="internal-login"><span class="icon">→</span>Đăng nhập</button>` : navs[role];
  const customer = role === "customer"; const admin = role === "admin";
  document.querySelector("#userInitials").textContent = customer ? (customerApi.hasToken() ? "KH" : "?") : admin ? "AD" : "NQ";
  document.querySelector("#userName").textContent = customer ? (customerApi.hasToken() ? "Đang tải hồ sơ" : "Khách ghé thăm") : admin ? "System Admin" : "Nguyễn Quản Lý";
  document.querySelector("#userRole").textContent = customer ? (customerApi.hasToken() ? "Khách hàng" : "Chưa đăng nhập") : admin ? "Quản trị viên" : "Quản lý hệ thống";
  document.querySelector("#sidebarCard").innerHTML = customer ? `<span>✦</span><strong>Khảo sát mới</strong><p>Một khảo sát đang chờ ý kiến của bạn.</p><button data-view="my-surveys">Thực hiện ngay →</button>` : admin ? `<span>✦</span><strong>Hệ thống ổn định</strong><p>Tất cả dịch vụ đang hoạt động bình thường.</p><button data-view="settings">Xem trạng thái →</button>` : `<span>✦</span><strong>Gợi ý hôm nay</strong><p>8 phản hồi mới đang chờ đội ngũ chăm sóc.</p><button data-view="feedback">Xem phản hồi →</button>`;
  document.querySelector("#globalSearch").placeholder = customer ? "Tìm trợ giúp..." : admin ? "Tìm tài khoản..." : "Tìm khách hàng...";
  document.querySelector("#roleSelect").value = role;
  const footerButton = document.querySelector(".sidebar-footer button");
  const authenticated = customer ? customerApi.hasToken() : internalApi.hasToken();
  footerButton.setAttribute("aria-label", authenticated ? "Đăng xuất" : "Tùy chọn");
  footerButton.onclick = authenticated ? () => {
    if (customer) { customerApi.logout(); customerSession.profile = null; }
    else { internalApi.logout(); internalSession.account = null; internalSession.loaded.clear(); }
    notify("Đã đăng xuất"); applyRole(role);
  } : null;
  render(customer ? (customerApi.hasToken() ? "customer-home" : "login") : internalApi.hasToken() ? (admin ? "admin-dashboard" : "dashboard") : "internal-login");
}

document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelector("#roleSelect").addEventListener("change", event => {
  const routes = { admin: "http://127.0.0.1:4173/", manager: "http://127.0.0.1:4174/", customer: "http://127.0.0.1:4175/" };
  window.location.assign(routes[event.target.value]);
});
document.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); document.querySelector("#globalSearch").focus(); } });
document.querySelector("#globalSearch").addEventListener("keydown", e => { if (e.key === "Enter" && currentRole === "manager") { render("customers"); setTimeout(() => { const input = document.querySelector("#customerSearch"); input.value = e.target.value; input.dispatchEvent(new Event("input")); }, 0); } });
document.title = APP_CONFIG.name;
applyRole(document.body.dataset.defaultRole || APP_CONFIG.defaultRole);
