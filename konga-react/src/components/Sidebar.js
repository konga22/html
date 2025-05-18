import React, { useEffect, useState } from 'react';

function Sidebar({ user, priceInfo, greetingOut, theme }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setFade(true); // 페이드아웃
    const timeout = setTimeout(() => {
      setFade(false); // 페이드인
    }, 400); // 트랜지션 시간과 맞춤
    return () => clearTimeout(timeout);
  }, [theme]);

  return (
    <aside
      className={`sidebar-animated${fade ? ' sidebar-fade' : ''}`}
      style={{
        width: 340,
        transition: 'background 0.5s, color 0.5s, opacity 0.4s',
        opacity: fade ? 0 : 1,
        padding: '36px 28px 0 28px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* 인삿말 자리는 항상 유지 */}
      <div style={{
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8
      }}>
        {user ? (
          <h1
            className={greetingOut ? "greeting-animated out" : "greeting-animated"}
            style={{
              color: theme === 'dark' ? '#3db2ff' : '#2692d6',
              fontWeight: 700,
              fontSize: 32,
              textAlign: 'left',
              margin: 0
            }}
          >
            {`${user.nickname}님 안녕하세요!`}
          </h1>
        ) : (
          // 로그인 전에는 빈 공간 또는 안내문구
          <span style={{
            color: theme === 'dark' ? '#3db2ff' : '#2692d6',
            fontWeight: 700,
            fontSize: 32,
            opacity: 0.2,
            textAlign: 'left'
          }}>
            &nbsp;
          </span>
        )}
      </div>
      <div id="realtime-clock" style={{
        fontSize: 18,
        marginBottom: 18,
        color: theme === 'dark' ? '#3db2ff' : '#2692d6',
        textAlign: 'left'
      }} />

      {/* 가격 정보 블록 (상단으로 이동) */}
      <div
        className="market-info"
        style={{
          background: theme === 'dark' ? '#393E46' : '#B3C8CF',
          color: theme === 'dark' ? '#f5f6fa' : '#23263a',
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          marginTop: 18,
          transition: 'background 0.5s'
        }}
      >
        <div style={{ fontSize: 16, color: theme === 'dark' ? '#b0b8c1' : '#6b7684', marginBottom: 6 }}>BTC/KRW</div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 6,
          color: theme === 'dark' ? '#fff' : '#23263a'
        }}>
          {priceInfo ? `₩${priceInfo.trade_price.toLocaleString()}` : '로딩중...'}
        </div>
        <div
          style={{
            color: priceInfo
              ? (priceInfo.signed_change_rate > 0
                ? (theme === 'dark' ? '#3ec486' : '#1ca97c')
                : (theme === 'dark' ? '#ff3b30' : '#d7263d'))
              : (theme === 'dark' ? '#fff' : '#23263a'),
            fontWeight: 600,
            marginBottom: 12
          }}
        >
          {priceInfo ? `${(priceInfo.signed_change_rate * 100).toFixed(2)}%` : ''}
        </div>
        <div
          style={{
            background: theme === 'dark' ? '#393E46' : '#B3C8CF',
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            color: theme === 'dark' ? '#fff' : '#23263a'
          }}
        >
          <div>24h 고가 <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>{priceInfo ? `₩${priceInfo.high_price.toLocaleString()}` : '-'}</b></div>
          <div>24h 저가 <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>{priceInfo ? `₩${priceInfo.low_price.toLocaleString()}` : '-'}</b></div>
          <div>24h 거래량 <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>{priceInfo ? `₩${priceInfo.acc_trade_price_24h.toLocaleString()}` : '-'}</b></div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
