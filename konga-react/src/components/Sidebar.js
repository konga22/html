import React, { useEffect, useState, useRef } from 'react';
import PositionPanel from './PositionPanel';

function highlightKeywords(text) {
  if (!text) return '';
  return text
    .replace(/상승세|골든크로스/g, '<span style="color:#1ca97c;font-weight:700;">$&</span>')
    .replace(/하락세|데드크로스/g, '<span style="color:#d7263d;font-weight:700;">$&</span>')
    .replace(/매수/g, '<span style="color:#1ca97c;font-weight:700;">$&</span>')
    .replace(/매도/g, '<span style="color:#d7263d;font-weight:700;">$&</span>')
    .replace(/과매수/g, '<span style="color:#f59e42;font-weight:700;">$&</span>')
    .replace(/과매도/g, '<span style="color:#3b82f6;font-weight:700;">$&</span>')
    .replace(/목표가/g, '<span style="color:#3db2ff;font-weight:700;">$&</span>')
    .replace(/지정가/g, '<span style="color:#3db2ff;font-weight:700;">$&</span>');
}

function toDollar(n) {
  if (!n && n !== 0) return '-';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Sidebar({ user, priceInfo, greetingOut, theme, usdRate, btcUsd, lastChartPrice, ...props }) {
  const [fade, setFade] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  let kimchiPremium = null;
  let kimchiPremiumAmount = null;
  if (priceInfo && btcUsd && usdRate) {
    const globalKrw = btcUsd * usdRate;
    kimchiPremium = ((priceInfo.trade_price / globalKrw - 1) * 100);
    kimchiPremiumAmount = priceInfo.trade_price - globalKrw;
  }

  const [strategy, setStrategy] = useState({ summary: '', detail: '', buyJudgement: '' });

  const positionPanelRef = useRef();

  const [lastPrice, setLastPrice] = useState(null);

  const usdPrice = lastPrice && usdRate ? lastPrice / usdRate : null;

  useEffect(() => {
    setFade(true); // 페이드아웃
    const timeout = setTimeout(() => {
      setFade(false); // 페이드인
    }, 400); // 트랜지션 시간과 맞춤
    return () => clearTimeout(timeout);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC')
        .then(res => res.json())
        .then(data => setLastPrice(data[0].trade_price));
    }, 2000); // 2초마다 갱신

    return () => clearInterval(interval);
  }, []);

  // 자동진입 핸들러
  const handleAutoEnter = () => {
    // 예시: strategy.detail에서 정보 추출
    // 실제로는 정규식 등으로 파싱 필요
    // 여기서는 예시로 "상승세"면 롱, "하락세"면 숏, 지정가/비율 등 추출
    let isLong = false;
    let isMarket = false;
    let entry = 0;
    let size = 0;

    if (strategy.detail.includes('매수')) isLong = true;
    if (strategy.detail.includes('지정가')) isMarket = false;
    else isMarket = true;

    // 지정가 추출 (예: "지정가 12345달러")
    const priceMatch = strategy.detail.match(/지정가\s*([0-9,.]+)달러/);
    if (priceMatch) entry = parseFloat(priceMatch[1].replace(/,/g, ''));
    else entry = props.lastPrice;

    // 비율 추출 (예: "20%씩 5회" → 20% * 5 = 100%)
    const percentMatch = strategy.detail.match(/([0-9]+)%씩\s*([0-9]+)회/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1], 10);
      const times = parseInt(percentMatch[2], 10);
      // 예시: balance의 20%씩
      size = (props.balance || 1000) * (percent / 100);
    } else {
      size = (props.balance || 1000) * 0.2; // 기본값
    }

    // 실제 진입 함수 호출
    if (positionPanelRef.current && positionPanelRef.current.autoEnterPosition) {
      positionPanelRef.current.autoEnterPosition({ isLong, isMarket, entry });
    }
  };

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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: theme === 'dark' ? '#2d3748' : '#e6ecf1'
      }}
    >
      {/* 인삿말 자리는 항상 유지 */}
      <div style={{
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%'
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
        style={{
          background: theme === 'dark' ? '#393E46' : '#B3C8CF',
          color: theme === 'dark' ? '#f5f6fa' : '#23263a',
          borderRadius: 18,
          padding: '16px 18px',
          marginBottom: 24,
          width: '90%',
          maxWidth: 300,
          minWidth: 220,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginRight: 'auto',
          marginLeft: 0
        }}
      >
        {/* 마켓명 */}
        <div style={{
          fontSize: 15,
          color: theme === 'dark' ? '#b0b8c1' : '#6b7684',
          marginBottom: 8,
          fontWeight: 500
        }}>
          BTC/KRW
        </div>
        {/* 가격대 + 등락률 한 줄에 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 2
        }}>
          <span style={{
            fontSize: 26,
            fontWeight: 700,
            color: theme === 'dark' ? '#fff' : '#23263a',
            letterSpacing: '-1px'
          }}>
            {priceInfo ? `₩${priceInfo.trade_price.toLocaleString()}` : '로딩중...'}
          </span>
          {priceInfo && (
            <span style={{
              fontSize: 17,
              fontWeight: 700,
              color: priceInfo.signed_change_rate > 0
                ? (theme === 'dark' ? '#3ec486' : '#1ca97c')
                : (theme === 'dark' ? '#ff3b30' : '#d7263d'),
              marginLeft: 2
            }}>
              {(priceInfo.signed_change_rate * 100).toFixed(2)}%
            </span>
          )}
        </div>
        {btcUsd && (
          <div style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#3b82f6',
            marginBottom: 6,
            marginTop: 0,
            letterSpacing: '-0.5px'
          }}>
            {toDollar(btcUsd)}
          </div>
        )}
        {/* 김치프리미엄 */}
        {(kimchiPremium !== null && kimchiPremiumAmount !== null) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
            marginTop: 2
          }}>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#f59e42'
            }}>
              김치프리미엄
            </span>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#f59e42'
            }}>
              {kimchiPremium.toFixed(2)}%
            </span>
            <span style={{
              fontSize: 15,
              color: kimchiPremiumAmount > 0 ? '#d7263d' : '#1ca97c',
              fontWeight: 700
            }}>
              {kimchiPremiumAmount > 0 ? '+' : ''}
              ₩{Math.abs(Math.round(kimchiPremiumAmount)).toLocaleString()}
            </span>
            {/* 물음표 아이콘 */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#e0e7ef',
                  color: '#3b82f6',
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'center',
                  lineHeight: '16px',
                  cursor: 'pointer',
                  border: '1px solid #b3c8cf',
                  marginLeft: 2
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(v => !v)}
              >?</span>
              {showTooltip && (
                <div style={{
                  position: 'absolute',
                  left: 20,
                  top: -8,
                  background: '#fff',
                  color: '#23263a',
                  border: '1px solid #b3c8cf',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  width: 200,
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}>
                  <b>김치프리미엄</b>은<br />
                  한국 거래소(업비트) 비트코인 가격이<br />
                  글로벌 시세(달러 × 환율)보다<br />
                  얼마나 더 비싼지(%)와<br />
                  실제 차액(원화)을 나타냅니다.
                </div>
              )}
            </div>
          </div>
        )}
       
        {/* 구분선 */}
        <div style={{
          borderTop: '1px solid #e0e7ef',
          margin: '10px 0 8px 0'
        }} />
        {/* 24h 정보 */}
        <div style={{
          fontSize: 14,
          color: theme === 'dark' ? '#fff' : '#23263a',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <div>
            <span style={{ color: '#b0b8c1', fontWeight: 500 }}>24h 고가 </span>
            <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>
              {priceInfo ? `₩${priceInfo.high_price.toLocaleString()}` : '-'}
            </b>
          </div>
          <div>
            <span style={{ color: '#b0b8c1', fontWeight: 500 }}>24h 저가 </span>
            <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>
              {priceInfo ? `₩${priceInfo.low_price.toLocaleString()}` : '-'}
            </b>
          </div>
          <div>
            <span style={{ color: '#b0b8c1', fontWeight: 500 }}>24h 거래량 </span>
            <b style={{ color: theme === 'dark' ? '#fff' : '#23263a' }}>
              {priceInfo ? `₩${priceInfo.acc_trade_price_24h.toLocaleString()}` : '-'}
            </b>
          </div>
        </div>
      </div>
      {/* 추천전략 박스 */}
      
      {/* 포지션(가상트레이딩) 컨테이너 */}
      <PositionPanel
        user={user}
        lastPrice={lastChartPrice}
        usdRate={usdRate}
      />
    </aside>
  );
}

export default Sidebar;
