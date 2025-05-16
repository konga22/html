// 실시간 시계
function updateClock() {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
    const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(koreaTime.getUTCSeconds()).padStart(2, '0');
    document.getElementById('realtime-clock').textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();

// 차트 관련 변수
let chart, candleSeries;
let currentInterval = '1';

// 차트 초기화 (오직 한 번만 선언, 거래량 시리즈 없이!)
function initChart() {
    const container = document.getElementById('chart-container');
    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: 500,
        layout: { background: { color: '#1e222d' }, textColor: '#DDD' },
        grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#2B2B43' },
        timeScale: { borderColor: '#2B2B43', timeVisible: true },
    });
    candleSeries = chart.addCandlestickSeries({
        upColor: '#34c759', downColor: '#ff3b30',
        borderUpColor: '#34c759', borderDownColor: '#ff3b30',
        wickUpColor: '#34c759', wickDownColor: '#ff3b30',
    });
    window.addEventListener('resize', () => {
        chart.applyOptions({ width: container.clientWidth, height: 500 });
    });
}

// Upbit API에서 캔들 데이터 가져오기
async function fetchCandleData(interval) {
    let unit = 'minutes';
    let count = 100;
    let queryInterval = 1;
    switch(interval) {
        case '1': queryInterval = 1; break;
        case '5': queryInterval = 5; break;
        case '15': queryInterval = 15; break;
        case '60': queryInterval = 60; break;
        case '240': queryInterval = 240; break;
        case 'D': unit = 'days'; queryInterval = 1; break;
    }
    const response = await fetch(`http://localhost:4000/api/candles/${unit}/${queryInterval}?market=KRW-BTC&count=${count}`);
    const data = await response.json();
    return data.map(d => ({
        time: new Date(d.candle_date_time_kst).getTime() / 1000,
        open: d.opening_price,
        high: d.high_price,
        low: d.low_price,
        close: d.trade_price
    })).reverse();
}

// 차트 데이터 세팅
async function handleIntervalChange(interval) {
    currentInterval = interval;
    document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.timeframe-btn[data-interval="${interval}"]`).classList.add('active');
    const data = await fetchCandleData(interval);
    candleSeries.setData(data);
}

// 가격/변동률/고저/거래량 표시
async function updateMarketInfo() {
    const response = await fetch('http://localhost:4000/api/ticker?markets=KRW-BTC');
    const [data] = await response.json();
    document.getElementById('current-price').textContent = `₩${data.trade_price.toLocaleString()}`;
    const changeRate = data.signed_change_rate * 100;
    const changeElem = document.getElementById('price-change');
    changeElem.textContent = `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(2)}%`;
    changeElem.className = 'change' + (changeRate >= 0 ? ' positive' : '');
    document.getElementById('high-24h').textContent = `₩${data.high_price.toLocaleString()}`;
    document.getElementById('low-24h').textContent = `₩${data.low_price.toLocaleString()}`;
    document.getElementById('volume-24h').textContent = `₩${Math.round(data.acc_trade_price_24h).toLocaleString()}`;
}

// 닉네임 표시 함수
function showNickname(animated = false) {
    const nicknameArea = document.getElementById('nickname-area');
    const logoutBtn = document.getElementById('logout-btn');
    const user = JSON.parse(localStorage.getItem('konga-current-user') || 'null');
    if (user && user.nickname) {
        nicknameArea.textContent = `${user.nickname} 님 안녕하세요 !`;
        nicknameArea.style.opacity = '1';
        nicknameArea.style.pointerEvents = 'auto';
        nicknameArea.style.display = 'block';
        logoutBtn.style.display = 'block';
        if (animated) {
            nicknameArea.style.animation = 'slide-in-left 0.7s cubic-bezier(.68,-0.55,.27,1.55)';
            nicknameArea.addEventListener('animationend', function handler() {
                nicknameArea.style.animation = 'none';
                nicknameArea.style.transform = 'translateX(0)';
                nicknameArea.removeEventListener('animationend', handler);
            });
        } else {
            nicknameArea.style.animation = 'none';
            nicknameArea.style.transform = 'translateX(0)';
        }
    } else {
        nicknameArea.textContent = 'KONGA';
        nicknameArea.style.opacity = '0';
        nicknameArea.style.pointerEvents = 'none';
        nicknameArea.style.display = 'block';
        nicknameArea.style.animation = 'none';
        nicknameArea.style.transform = 'translateX(-40px)';
        logoutBtn.style.display = 'none';
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    initChart();
    await handleIntervalChange('1');
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', () => handleIntervalChange(btn.dataset.interval));
    });
    updateMarketInfo();
    setInterval(updateMarketInfo, 1000);

    // 3초마다 차트 데이터 갱신
    setInterval(() => {
        handleIntervalChange(currentInterval);
    }, 3000);

    // 로그인/회원가입 오버레이 제어
    const overlay = document.getElementById('auth-overlay');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const showSignup = document.getElementById('show-signup');
    const backToLogin = document.getElementById('back-to-login');
    const nicknameInput = document.getElementById('signup-nickname');
    const checkNicknameBtn = document.getElementById('check-nickname-btn');
    const nicknameCheckResult = document.getElementById('nickname-check-result');

    // 회원 데이터 저장 (localStorage 사용)
    function getUsers() {
        return JSON.parse(localStorage.getItem('konga-users') || '[]');
    }
    function saveUsers(users) {
        localStorage.setItem('konga-users', JSON.stringify(users));
    }

    // 회원가입 폼 전환
    showSignup.addEventListener('click', () => {
        loginForm.style.display = 'none';
        loginError.textContent = '';
        signupForm.style.display = 'flex';
        backToLogin.style.display = 'block';
    });
    backToLogin.addEventListener('click', () => {
        signupForm.style.display = 'none';
        signupError.textContent = '';
        loginForm.style.display = 'flex';
        backToLogin.style.display = 'none';
    });

    // 닉네임 중복확인
    checkNicknameBtn.addEventListener('click', () => {
        const nickname = nicknameInput.value.trim();
        if (!nickname) {
            nicknameCheckResult.textContent = '닉네임을 입력하세요.';
            return;
        }
        const users = getUsers();
        if (users.some(u => u.nickname === nickname)) {
            nicknameCheckResult.textContent = '이미 사용 중인 닉네임입니다.';
        } else {
            nicknameCheckResult.textContent = '사용 가능한 닉네임입니다!';
        }
    });

    // 회원가입 처리
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const nickname = document.getElementById('signup-nickname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const pw1 = document.getElementById('signup-password').value.trim();
        const pw2 = document.getElementById('signup-password2').value.trim();
        const users = getUsers();

        if (!nickname || !email || !pw1 || !pw2) {
            signupError.textContent = '모든 항목을 입력하세요.';
            return;
        }
        if (pw1 !== pw2) {
            signupError.textContent = '비밀번호가 일치하지 않습니다.';
            return;
        }
        if (users.some(u => u.nickname === nickname)) {
            signupError.textContent = '이미 사용 중인 닉네임입니다.';
            return;
        }
        if (users.some(u => u.email === email)) {
            signupError.textContent = '이미 사용 중인 이메일입니다.';
            return;
        }
        // 회원가입 성공
        users.push({ nickname, email, password: pw1 });
        saveUsers(users);
        signupError.textContent = '';
        alert('회원가입이 완료되었습니다! 이제 로그인 해주세요.');
        signupForm.style.display = 'none';
        backToLogin.style.display = 'none';
        loginForm.style.display = 'flex';
        nicknameCheckResult.textContent = '';
        signupForm.reset();
    });

    // 로그인 처리
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const users = getUsers();
        if (!email || !password) {
            loginError.textContent = '이메일과 비밀번호를 모두 입력하세요.';
            return;
        }
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            loginError.textContent = '';
            localStorage.setItem('konga-current-user', JSON.stringify(user));
            overlay.classList.add('hide');
            setTimeout(() => {
                overlay.style.display = 'none';
                showNickname(true);
            }, 800);
        } else {
            loginError.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
    });

    showNickname();

    // 로그아웃 버튼 이벤트
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('konga-current-user');
            showNickname(false);
            // 오버레이 다시 띄우기
            const overlay = document.getElementById('auth-overlay');
            overlay.style.display = 'flex';
            setTimeout(() => overlay.classList.remove('hide'), 10);
        });
    }
});