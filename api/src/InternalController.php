<?php
declare(strict_types=1);

namespace App;

use PDO;

final class InternalController
{
    public function __construct(private readonly PDO $db) {}

    public function handle(string $method, string $path): bool
    {
        if ($method === 'POST' && $path === '/internal/auth/login') {
            $this->login(Http::body());
        }
        if (!str_starts_with($path, '/internal')) {
            return false;
        }

        $account = $this->authenticatedAccount();
        if ($method === 'GET' && $path === '/internal/me') {
            Http::json(200, ['account' => $account]);
        }
        if ($method === 'GET' && $path === '/internal/dashboard') {
            Http::json(200, $this->dashboard());
        }
        if ($method === 'GET' && $path === '/internal/customers') {
            Http::json(200, ['customers' => $this->customers()]);
        }
        if ($method === 'GET' && $path === '/internal/feedback') {
            Http::json(200, ['feedback' => $this->feedback()]);
        }
        if ($method === 'PATCH' && preg_match('#^/internal/feedback/(\d+)$#', $path, $matches)) {
            $this->updateFeedback((int) $account['id'], (int) $matches[1], Http::body());
        }
        if ($method === 'GET' && $path === '/internal/surveys') {
            Http::json(200, ['surveys' => $this->surveys()]);
        }
        if ($method === 'POST' && $path === '/internal/surveys') {
            $this->createSurvey((int) $account['id'], Http::body());
        }
        if ($method === 'GET' && $path === '/internal/accounts') {
            $this->requireAdmin($account);
            Http::json(200, ['accounts' => $this->accounts()]);
        }
        if ($method === 'GET' && $path === '/internal/branches') {
            Http::json(200, ['branches' => $this->branches()]);
        }
        if ($method === 'GET' && $path === '/internal/catalogs') {
            Http::json(200, $this->catalogs());
        }
        return false;
    }

    private function login(array $body): never
    {
        $username = trim((string) ($body['tenDangNhap'] ?? ''));
        $password = (string) ($body['matKhau'] ?? '');
        Http::require($username !== '' && $password !== '', 'Vui lòng nhập tên đăng nhập và mật khẩu');
        $statement = $this->db->prepare(<<<'SQL'
            SELECT t.id,t.ten_dang_nhap,t.mat_khau_hash,t.vai_tro,t.trang_thai,t.chi_nhanh_id,
                   b.ten_chi_nhanh AS "tenChiNhanh"
              FROM tai_khoan t LEFT JOIN chi_nhanh b ON b.id=t.chi_nhanh_id
             WHERE t.ten_dang_nhap=lower(btrim(:username))
        SQL);
        $statement->execute(['username' => $username]);
        $account = $statement->fetch();
        if (!$account || !Auth::verifyPassword($password, $account['mat_khau_hash'])) {
            throw new ApiException(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng');
        }
        if ($account['trang_thai'] !== 'active') {
            throw new ApiException(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
        }
        if (!in_array($account['vai_tro'], ['admin', 'manager'], true)) {
            throw new ApiException(403, 'WRONG_PORTAL', 'Tài khoản không có quyền truy cập Admin/Manager');
        }
        $token = Auth::createToken($account);
        Http::json(200, ['token' => $token, 'account' => [
            'id' => $account['id'], 'tenDangNhap' => $account['ten_dang_nhap'], 'role' => $account['vai_tro'],
            'status' => $account['trang_thai'], 'chiNhanhId' => $account['chi_nhanh_id'], 'tenChiNhanh' => $account['tenChiNhanh'],
        ]]);
    }

    private function authenticatedAccount(): array
    {
        $payload = Auth::readToken(Http::bearerToken());
        if (!$payload) {
            throw new ApiException(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
        }
        $statement = $this->db->prepare(<<<'SQL'
            SELECT t.id,t.ten_dang_nhap AS "tenDangNhap",t.vai_tro AS role,t.trang_thai AS status,
                   t.chi_nhanh_id AS "chiNhanhId",b.ten_chi_nhanh AS "tenChiNhanh"
              FROM tai_khoan t LEFT JOIN chi_nhanh b ON b.id=t.chi_nhanh_id WHERE t.id=:id
        SQL);
        $statement->execute(['id' => (int) $payload['sub']]);
        $account = $statement->fetch();
        if (!$account || $account['status'] !== 'active') {
            throw new ApiException(401, 'ACCOUNT_INACTIVE', 'Tài khoản đã bị khóa hoặc không tồn tại');
        }
        if (!in_array($account['role'], ['admin', 'manager'], true)) {
            throw new ApiException(403, 'FORBIDDEN', 'Chức năng chỉ dành cho Admin và Manager');
        }
        return $account;
    }

    private function requireAdmin(array $account): void
    {
        if ($account['role'] !== 'admin') {
            throw new ApiException(403, 'FORBIDDEN', 'Chức năng chỉ dành cho Admin');
        }
    }

    private function dashboard(): array
    {
        $summary = $this->db->query(<<<'SQL'
            SELECT count(*)::int AS "totalCustomers",
                   count(*) FILTER (WHERE t.trang_thai='active')::int AS "activeCustomers",
                   (SELECT count(*)::int FROM phan_hoi) AS "totalFeedback",
                   (SELECT count(*)::int FROM phan_hoi WHERE trang_thai='moi') AS "newFeedback",
                   (SELECT coalesce(round(avg(so_sao),2),0) FROM phan_hoi) AS "averageRating",
                   (SELECT count(*)::int FROM khao_sat) AS "totalSurveys",
                   (SELECT count(*)::int FROM tai_khoan) AS "totalAccounts",
                   (SELECT count(*)::int FROM tai_khoan WHERE vai_tro<>'customer') AS "internalAccounts"
              FROM khach_hang h JOIN tai_khoan t ON t.id=h.tai_khoan_id
        SQL)->fetch();
        $recent = $this->db->query(<<<'SQL'
            SELECT h.tai_khoan_id AS id,h.ho_ten AS name,h.ma_thanh_vien AS code,
                   extract(year FROM current_date)::int-h.nam_sinh AS age,s.ten_nhom AS preference,
                   t.trang_thai AS status,h.ngay_cap_nhat AS "updatedAt"
              FROM khach_hang h JOIN tai_khoan t ON t.id=h.tai_khoan_id
              JOIN nhom_so_thich s ON s.id=h.so_thich_id
             ORDER BY h.ngay_cap_nhat DESC,h.tai_khoan_id DESC LIMIT 5
        SQL)->fetchAll();
        return ['summary' => $summary, 'recentCustomers' => $recent];
    }

    private function customers(): array
    {
        return $this->db->query(<<<'SQL'
            SELECT h.tai_khoan_id AS id,h.ho_ten AS name,h.ma_thanh_vien AS code,t.ten_dang_nhap AS username,
                   extract(year FROM current_date)::int-h.nam_sinh AS age,s.ten_nhom AS preference,
                   t.trang_thai AS status,h.ngay_cap_nhat AS "updatedAt"
              FROM khach_hang h JOIN tai_khoan t ON t.id=h.tai_khoan_id
              JOIN nhom_so_thich s ON s.id=h.so_thich_id
             ORDER BY h.ngay_cap_nhat DESC,h.tai_khoan_id DESC
        SQL)->fetchAll();
    }

    private function feedback(): array
    {
        return $this->db->query(<<<'SQL'
            SELECT p.id,h.ho_ten AS "customerName",h.ma_thanh_vien AS "memberCode",d.ten_do_uong AS "drinkName",
                   b.ten_chi_nhanh AS "branchName",p.so_sao AS rating,p.noi_dung AS content,
                   p.trang_thai AS status,p.ngay_gui AS "sentAt",p.ngay_xu_ly AS "handledAt",
                   p.phan_hoi_cua_nhan_vien AS reply,p.ngay_phan_hoi AS "repliedAt"
              FROM phan_hoi p JOIN khach_hang h ON h.tai_khoan_id=p.khach_hang_id
              JOIN do_uong d ON d.id=p.do_uong_id LEFT JOIN chi_nhanh b ON b.id=p.chi_nhanh_id
             ORDER BY p.ngay_gui DESC,p.id DESC
        SQL)->fetchAll();
    }

    private function updateFeedback(int $accountId, int $feedbackId, array $body): never
    {
        $status = (string) ($body['status'] ?? '');
        $reply = trim((string) ($body['reply'] ?? ''));
        Http::require(in_array($status, ['da_xem', 'da_tiep_thu'], true), 'Trạng thái phản hồi không hợp lệ');
        Http::require($reply === '' || (mb_strlen($reply) >= 3 && mb_strlen($reply) <= 2000), 'Nội dung trả lời phải có từ 3 đến 2000 ký tự');
        $this->db->beginTransaction();
        try {
        $statement = $this->db->prepare('SELECT crm_xu_ly_phan_hoi(:account,:feedback,CAST(:status AS trang_thai_phan_hoi))');
        $statement->execute(['account' => $accountId, 'feedback' => $feedbackId, 'status' => $status]);
        if ($reply !== '') {
            $update = $this->db->prepare('UPDATE phan_hoi SET phan_hoi_cua_nhan_vien=:reply,ngay_phan_hoi=clock_timestamp() WHERE id=:id RETURNING khach_hang_id');
            $update->execute(['reply' => $reply, 'id' => $feedbackId]);
            $customerId = (int) $update->fetchColumn();
            $notify = $this->db->prepare("INSERT INTO thong_bao(tai_khoan_id,loai,tieu_de,noi_dung,lien_ket) VALUES (:customer,'feedback_reply','Phản hồi của bạn đã được trả lời',:content,'my-feedback')");
            $notify->execute(['customer' => $customerId, 'content' => $reply]);
        }
        $this->db->commit();
        } catch (\Throwable $error) {
            $this->db->rollBack();
            throw $error;
        }
        Http::json(200, ['message' => 'Đã cập nhật trạng thái phản hồi']);
    }

    private function createSurvey(int $accountId, array $body): never
    {
        $title = trim((string) ($body['title'] ?? ''));
        $description = trim((string) ($body['description'] ?? ''));
        $endAt = $body['endAt'] ?? null;
        $questions = $body['questions'] ?? [];
        Http::require(mb_strlen($title) >= 3 && mb_strlen($title) <= 255, 'Tiêu đề khảo sát phải có từ 3 đến 255 ký tự');
        Http::require(is_array($questions) && $questions !== [], 'Khảo sát phải có ít nhất một câu hỏi');
        $this->db->beginTransaction();
        try {
            $surveyStatement = $this->db->prepare('INSERT INTO khao_sat(tieu_de,mo_ta,nguoi_tao_id,ngay_ket_thuc) VALUES (:title,:description,:account,:end_at) RETURNING id');
            $surveyStatement->execute(['title' => $title, 'description' => $description ?: null, 'account' => $accountId, 'end_at' => $endAt ?: null]);
            $surveyId = (int) $surveyStatement->fetchColumn();
            $questionStatement = $this->db->prepare('INSERT INTO cau_hoi(khao_sat_id,noi_dung,thu_tu,bat_buoc) VALUES (:survey,:content,:position,true) RETURNING id');
            $choiceStatement = $this->db->prepare('INSERT INTO lua_chon(cau_hoi_id,noi_dung,thu_tu) VALUES (:question,:content,:position)');
            foreach ($questions as $questionIndex => $question) {
                $content = trim((string) ($question['content'] ?? ''));
                $choices = array_values(array_filter(array_map('trim', $question['choices'] ?? [])));
                Http::require(mb_strlen($content) >= 3 && count($choices) >= 2, 'Mỗi câu hỏi cần nội dung và ít nhất hai lựa chọn');
                $questionStatement->execute(['survey' => $surveyId, 'content' => $content, 'position' => $questionIndex + 1]);
                $questionId = (int) $questionStatement->fetchColumn();
                foreach ($choices as $choiceIndex => $choice) {
                    $choiceStatement->execute(['question' => $questionId, 'content' => $choice, 'position' => $choiceIndex + 1]);
                }
            }
            $publish = $this->db->prepare('SELECT crm_phat_hanh_khao_sat(:account,:survey,NULL)');
            $publish->execute(['account' => $accountId, 'survey' => $surveyId]);
            $recipients = (int) $publish->fetchColumn();
            $notification = $this->db->prepare("INSERT INTO thong_bao(tai_khoan_id,loai,tieu_de,noi_dung,lien_ket) SELECT khach_hang_id,'survey','Khảo sát mới',:content,'my-surveys' FROM phan_phoi_khao_sat WHERE khao_sat_id=:survey");
            $notification->execute(['content' => $title, 'survey' => $surveyId]);
            $this->db->commit();
        } catch (\Throwable $error) {
            $this->db->rollBack();
            throw $error;
        }
        Http::json(201, ['surveyId' => $surveyId, 'recipients' => $recipients, 'message' => 'Đã phát hành khảo sát và gửi thông báo']);
    }

    private function surveys(): array
    {
        return $this->db->query(<<<'SQL'
            SELECT k.id,k.tieu_de AS title,k.mo_ta AS description,k.trang_thai AS status,
                   k.ngay_tao AS "createdAt",k.ngay_ket_thuc AS "endAt",
                   count(p.khach_hang_id)::int AS recipients,count(p.ngay_hoan_thanh)::int AS completed,
                   coalesce(round(100.0*count(p.ngay_hoan_thanh)/nullif(count(p.khach_hang_id),0),2),0) AS "completionRate"
              FROM khao_sat k LEFT JOIN phan_phoi_khao_sat p ON p.khao_sat_id=k.id
             GROUP BY k.id ORDER BY k.ngay_tao DESC,k.id DESC
        SQL)->fetchAll();
    }

    private function accounts(): array
    {
        return $this->db->query(<<<'SQL'
            SELECT t.id,t.ten_dang_nhap AS username,t.vai_tro AS role,t.trang_thai AS status,
                   b.ten_chi_nhanh AS "branchName",t.ngay_tao AS "createdAt"
              FROM tai_khoan t LEFT JOIN chi_nhanh b ON b.id=t.chi_nhanh_id
             WHERE t.vai_tro<>'customer' ORDER BY t.id
        SQL)->fetchAll();
    }

    private function branches(): array
    {
        return $this->db->query('SELECT id,ma_chi_nhanh AS code,ten_chi_nhanh AS name,dia_chi AS address,so_dien_thoai AS phone,dang_hoat_dong AS active FROM chi_nhanh ORDER BY id')->fetchAll();
    }

    private function catalogs(): array
    {
        return [
            'drinks' => $this->db->query('SELECT id,ma_do_uong AS code,ten_do_uong AS name,mo_ta AS description,dang_kinh_doanh AS active FROM do_uong ORDER BY id')->fetchAll(),
            'preferences' => $this->db->query('SELECT id,ten_nhom AS name,mo_ta AS description,dang_su_dung AS active FROM nhom_so_thich ORDER BY id')->fetchAll(),
        ];
    }
}
