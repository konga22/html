document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('login-error');

    // 간단한 유효성 검사
    if (!email || !password) {
        errorDiv.textContent = '이메일과 비밀번호를 모두 입력하세요.';
        return;
    }
    // 예시: 이메일/비밀번호 하드코딩 (실제 서비스에서는 서버와 연동 필요)
    if (email === 'test@konga.com' && password === '1234') {
        errorDiv.textContent = '';
        // 로그인 성공 시 메인 페이지로 이동 (index.html)
        window.location.href = '../index.html';
    } else {
        errorDiv.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
});
