"""Xác minh bcrypt tài khoản demo qua tiện ích htpasswd của hệ điều hành."""
import getpass
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def verify_password(password: str, encoded: str) -> bool:
    if not encoded.startswith(('$2y$', '$2b$', '$2a$')):
        return False
    with tempfile.NamedTemporaryFile('w', encoding='utf-8') as password_file:
        password_file.write(f'demo:{encoded}\n')
        password_file.flush()
        result = subprocess.run(
            ['htpasswd', '-vb', password_file.name, 'demo', password],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False
        )
        return result.returncode == 0


if __name__ == '__main__':
    username = sys.argv[1] if len(sys.argv) > 1 else 'khach01'
    sql = Path(__file__).with_name('03_demo_data.sql').read_text(encoding='utf-8')
    match = re.search(r"\(\d+,'" + re.escape(username) + r"','([^']+)'", sql)
    if not match:
        raise SystemExit('Không có tài khoản này trong file demo.')
    password = getpass.getpass('Mật khẩu demo: ')
    print('Mật khẩu khớp.' if verify_password(password, match.group(1)) else 'Mật khẩu không khớp.')
    print('Backend còn phải kiểm tra trạng thái active và vai trò trước khi cấp phiên.')
