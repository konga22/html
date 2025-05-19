import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chart from './components/Chart';
import AuthModal from './components/AuthModal';
import MyPage from './components/MyPage';
import ThemeToggleButton from './components/ThemeToggleButton';
import PositionPanel from './components/PositionPanel';
import './App.css';

function MainPage({ user, priceInfo, onMyPage, onLogout }) {
  return (
    <>
      <Sidebar user={user} priceInfo={priceInfo} />
      <main style={{ flex: 1, padding: '48px 32px 0 32px' }}>
        <Chart />
      </main>
    </>
  );
}

function AppRoutes({ user, priceInfo, handleUpdateUser, handleLogout }) {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <MainPage
              user={user}
              priceInfo={priceInfo}
              onMyPage={() => navigate('/mypage')}
              onLogout={handleLogout}
            />
          </div>
        }
      />
      <Route
        path="/mypage"
        element={
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
              user={user}
              priceInfo={priceInfo}
              onMyPage={() => navigate('/mypage')}
              onLogout={handleLogout}
            />
            <main style={{ flex: 1, padding: '48px 32px 0 32px' }}>
              <MyPage user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />
            </main>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [blurOut, setBlurOut] = useState(true);
  const [greetingOut, setGreetingOut] = useState(false);
  const [authOut, setAuthOut] = useState(false);
  const [authIn, setAuthIn] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [themeTrans, setThemeTrans] = useState(false); // 테마 전환 애니메이션용
  const [usdRate, setUsdRate] = useState(1350); // 임시 환율, 실제로는 API로 받아올 수 있음
  const [btcUsd, setBtcUsd] = useState(null);
  const [lastChartPrice, setLastChartPrice] = useState(null);

  // 실시간 시계
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
      const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(koreaTime.getUTCSeconds()).padStart(2, '0');
      const clockElem = document.getElementById('realtime-clock');
      if (clockElem) {
        clockElem.textContent = `${hours}:${minutes}:${seconds}`;
      }
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 가격 정보
  useEffect(() => {
    async function fetchPrice() {
      const res = await fetch('http://localhost:4000/api/ticker?markets=KRW-BTC');
      const [data] = await res.json();
      setPriceInfo(data);
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 1000);
    return () => clearInterval(interval);
  }, []);

  // 로그인 유저 정보 (localStorage에서)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('konga-current-user') || 'null');
    setUser(user);
    if (!user) {
      setShowAuth(true);
      setAuthIn(true); // 로그인 창 표시
    }
  }, []);

  // 로그인 성공 시
  const handleLoginSuccess = (user) => {
    setUser(user);
    setAuthOut(true);    // 로그인창 젤리 아웃
    setAuthIn(false);
    setTimeout(() => {
      setShowAuth(false);
      setBlurOut(true);
      setGreetingOut(false);
      setAuthOut(false); // 상태 초기화
    }, 700); // 젤리 아웃 애니메이션 시간과 맞춤
  };

  // 유저 정보 업데이트
  const handleUpdateUser = updatedUser => {
    setUser(updatedUser);
  };

  // 로그아웃
  const handleLogout = () => {
    setGreetingOut(true);
    setBlurOut(true); // 블러 투명하게
    setAuthIn(false);

    setTimeout(() => {
      localStorage.removeItem('konga-current-user');
      setUser(null);
      setShowAuth(true); // 블러/로그인창 렌더링
      setShowMyPage(false);
      setGreetingOut(false);

      setTimeout(() => {
        setBlurOut(false); // 블러 페이드인!
        setAuthIn(true);   // 로그인창 젤리 인
      }, 30); // 1프레임 딜레이
    }, 500);
  };

  // 테마 전환 함수
  const handleThemeToggle = () => {
    setThemeTrans(true); // 페이드 효과 시작
    setTimeout(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      setTimeout(() => setThemeTrans(false), 500); // 페이드 효과 종료
    }, 300); // 페이드아웃 후 테마 변경
  };

  useEffect(() => {
    document.body.classList.add('dark');
    return () => document.body.classList.remove('dark');
  }, []);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  // 환율 API로 실시간 환율 받아오기 (선택)
  useEffect(() => {
    fetch('https://api.exchangerate.host/latest?base=KRW&symbols=USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.USD) {
          setUsdRate(1 / data.rates.USD); // KRW → USD 환율
        }
      });
  }, []);

  // 글로벌 BTC/USD 시세 가져오기 (코인게코)
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then(res => res.json())
      .then(data => {
        if (data && data.bitcoin && data.bitcoin.usd) {
          setBtcUsd(data.bitcoin.usd);
        }
      });
  }, []);

  return (
    <>
      {/* 오른쪽 상단 버튼 그룹 */}
      <div className="chart-top-buttons">
        <ThemeToggleButton theme={theme} setTheme={setTheme} />
        <button className="user-menu-btn point" onClick={() => setShowMyPage(true)}>마이페이지</button>
        <button className="user-menu-btn logout" onClick={handleLogout}>로그아웃</button>
      </div>

      {/* 마이페이지 모달 */}
      {showMyPage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <MyPage 
              user={user} 
              onUpdateUser={setUser} 
              onLogout={handleLogout} 
              onClose={() => setShowMyPage(false)}
            />
          </div>
        </div>
      )}

      {/* 메인 레이아웃 */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          user={user}
          priceInfo={priceInfo}
          btcUsd={btcUsd}
          usdRate={usdRate}
          greetingOut={greetingOut}
          theme={theme}
          lastChartPrice={lastChartPrice}
        />
        <main style={{ flex: 1, padding: '48px 32px 0 32px', position: 'relative' }}>
          <Chart theme={theme} usdRate={usdRate} setLastChartPrice={setLastChartPrice} />
        </main>
      </div>

      {/* 로그인 오버레이/블러 */}
      {showAuth && (
        <>
          <div className={`blur-bg${blurOut ? ' blur-out' : ''}`}></div>
          <AuthModal
            onLoginSuccess={handleLoginSuccess}
            setBlurOut={setBlurOut}
            authOut={authOut}
            authIn={authIn}
          />
        </>
      )}
    </>
  );
}

export default App;
