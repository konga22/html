import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

function toDollar(n) {
  if (!n && n !== 0) return '-';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PositionPanel = forwardRef(({ user, lastPrice, theme, usdRate }, ref) => {
  const userId = user?.id || user?.nickname || 'guest';
  const storageKey = `virtual-balance-${userId}`;

  // 1. 잔고 상태를 localStorage에서 불러오도록 초기화
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Number(saved) : 1000; // 기본값 1000
  });

  // 2. userId가 바뀔 때마다 localStorage에서 잔고를 다시 불러옴
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setBalance(saved ? Number(saved) : 1000);
  }, [storageKey]);

  // 3. 잔고가 바뀔 때마다 localStorage에 자동 저장
  useEffect(() => {
    localStorage.setItem(storageKey, balance);
  }, [balance, storageKey]);

  useEffect(() => {
    if (balance < 0) setBalance(0);
  }, [balance]);

  const [position, setPosition] = useState(null); // {type, entry, size, isMarket, isLong}
  const [inputPrice, setInputPrice] = useState(''); // 지정가 입력
  const [percent, setPercent] = useState(25); // 슬라이더 값 (25, 50, 75, 100)
  const [leverage, setLeverage] = useState(1);
  const leverageMarks = [1, 25, 50, 75, 100];

  const usdPrice = lastPrice && usdRate ? lastPrice / usdRate : null;

  // 실시간 수익률 계산
  let pnl = 0, pnlPercent = 0;
  if (position) {
    const lev = position.leverage || 1;
    if (position.isLong) {
      pnl = (lastPrice - position.entry) * position.size / position.entry * lev;
      pnlPercent = (lastPrice - position.entry) / position.entry * lev * 100;
    } else {
      pnl = (position.entry - lastPrice) * position.size / position.entry * lev;
      pnlPercent = (position.entry - lastPrice) / lastPrice * lev * 100;
    }
  }

  // 진입 함수
  const enterPosition = (isLong) => {
    const size = (balance * percent) / 100;
    if (!size || size > balance) return alert('진입 금액 오류');
    let isMarket = !inputPrice;
    let entry = isMarket ? lastPrice : parseFloat(inputPrice);

    // 오류 메시지 구체화
    if (!isMarket && !inputPrice) {
      return alert('지정가를 입력하거나 입력란을 비워 시장가로 진입하세요.');
    }
    if (!entry || isNaN(entry) || entry <= 0) {
      return alert('유효한 가격을 입력하세요.');
    }

    setPosition({ isLong, isMarket, entry, size });
    setBalance(prev => Math.max(0, prev - size));
  };

  // 포지션 청산
  const closePosition = () => {
    if (!position) return;
    setBalance(prev => Math.max(0, prev + position.size + pnl));
    setPosition(null);
    setInputPrice('');
  };

  const handleStrategyAutoEnter = ({ isLong, isMarket, entry }) => {
    const size = (balance * percent) / 100;
    setPosition({
      isLong,
      isMarket,
      entry,
      size,
      isStrategy: true,
      pending: false
    });
    setBalance(prev => Math.max(0, prev - size));
  };

  const handleStrategyPending = ({ isLong, entry }) => {
    setPosition({
      isLong,
      entry,
      size: (balance * percent) / 100,
      isStrategy: true,
      pending: true
    });
  };

  useImperativeHandle(ref, () => ({
    handleStrategyAutoEnter
  }));

  // 슬라이더 포인트 라벨
  const marks = [25, 50, 75, 100];

  const [lastChartPrice, setLastChartPrice] = useState(null);

  console.log('PositionPanel lastPrice:', lastPrice);

  useEffect(() => {
    if (position && position.pending) {
      if (
        (position.isLong && lastPrice >= position.entry) ||
        (!position.isLong && lastPrice <= position.entry)
      ) {
        setPosition({ ...position, pending: false });
        setBalance(prev => Math.max(0, prev - position.size));
      }
    }
    // eslint-disable-next-line
  }, [lastPrice]);

  useEffect(() => {
    if (position && !position.pending) {
      if (pnlPercent <= -100) {
        setPosition(null);
        setInputPrice('');
        setBalance(0);
        alert('포지션이 -100% 손실로 자동 청산되었습니다.');
      }
    }
    // eslint-disable-next-line
  }, [pnlPercent]);

  return (
    <div
      style={{
        marginTop: 24,
        padding: '22px 18px',
        background: theme === 'dark' ? '#393E46' : '#B3C8CF',
        color: theme === 'dark' ? '#f5f6fa' : '#23263a',
        borderRadius: 18,
        width: '90%',
        maxWidth: 300,
        minWidth: 220,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}
    >
      {/* 타이틀 */}
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>가상 트레이딩</div>
      <div style={{ fontSize: 15, marginBottom: 4 }}>잔고: <b>{toDollar(balance)}</b></div>
      
      {/* 구분선 */}
      <div style={{ width: '100%', borderTop: '1px solid #e0e7ef', margin: '6px 0 6px 0' }} />

      {/* 슬라이더 */}
      <div style={{ width: '100%', margin: '0 0 8px 0' }}>
        <input
          type="range"
          min={25}
          max={100}
          step={25}
          value={percent}
          onChange={e => setPercent(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 2 }}>
          {marks.map(m => (
            <span key={m} style={{
              color: percent === m ? (theme === 'dark' ? '#3db2ff' : '#2692d6') : '#b0b8c1',
              fontWeight: percent === m ? 700 : 400
            }}>{m}%</span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 14, marginBottom: 2, color: '#3db2ff' }}>
        진입 금액: <b>{toDollar((balance * percent) / 100)}</b>
      </div>

      {/* 레버리지 */}
      <div style={{ width: '90%', margin: '8px auto 0 auto', textAlign: 'left' }}>
        <label style={{ fontSize: 14, fontWeight: 600, marginRight: 8 }}>레버리지</label>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={leverageMarks.indexOf(leverage)}
          onChange={e => setLeverage(leverageMarks[Number(e.target.value)])}
          style={{ width: '80%', verticalAlign: 'middle', display: 'inline-block' }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 8 }}>{leverage}배</span>
        {/* 숫자 라벨 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          marginTop: 2,
          width: '80%',
          margin: '0 auto'
        }}>
          {leverageMarks.map((m, i) => (
            <span key={m} style={{
              color: leverage === m ? '#3db2ff' : '#b0b8c1',
              fontWeight: leverage === m ? 700 : 400,
              flex: 1,
              minWidth: 0,
              textAlign: 'center'
            }}>{m}</span>
          ))}
        </div>
      </div>

      {/* 지정가 입력 + 시장가 안내 */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 4 }}>
        <input
          type="number"
          placeholder="지정가(선택)"
          value={inputPrice}
          onChange={e => setInputPrice(e.target.value)}
          style={{ width: '100%', fontSize: 14, borderRadius: 5, border: '1px solid #b3c8cf', padding: '4px 6px' }}
        />
        <span style={{ fontSize: 13, color: '#3db2ff', marginTop: 2 }}>
          시장가(현재가: <b>{toDollar(lastPrice)}</b>)로 진입합니다
        </span>
      </div>

      {/* 진입 버튼 */}
      <div style={{ width: '100%', display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
        <button
          onClick={() => enterPosition(true)}
          style={{
            background: '#1ca97c',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 0',
            fontWeight: 700,
            flex: 1,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >롱 진입</button>
        <button
          onClick={() => enterPosition(false)}
          style={{
            background: '#d7263d',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 0',
            fontWeight: 700,
            flex: 1,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >숏 진입</button>
      </div>

      {/* 1000달러 받기 버튼 */}
      <button
        style={{
          marginTop: 10,
          background: '#3db2ff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '7px 0',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          fontSize: 15
        }}
        onClick={() => setBalance(balance + 1000)}
      >
        1000달러 받기
      </button>

      {/* 포지션 정보 */}
      {position && (
        <div
          style={{
            marginTop: 14,
            width: '100%',
            background: position.isStrategy ? '#23263a' : (theme === 'dark' ? '#23263a' : '#e6ecf1'),
            borderRadius: 10,
            padding: '12px 10px',
            fontSize: 15,
            textAlign: 'left',
            opacity: 1
          }}
        >
          <div style={{ color: position.isLong ? '#d7263d' : '#1ca97c', fontWeight: 700, fontSize: 16 }}>
            {position.isLong ? '숏' : '롱'} 포지션
            {position.isStrategy && (
              <span style={{
                marginLeft: 8,
                background: '#3db2ff',
                color: '#fff',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 700,
                verticalAlign: 'middle'
              }}>
                추천전략
              </span>
            )}
          </div>
          <div>진입가: <b>{toDollar(position.entry)}</b></div>
          <div>진입금액: <b>${position.size}</b></div>
          <div>현재가: <b>{toDollar(lastPrice)}</b></div>
          <div>레버리지: <b>{position.leverage}배</b></div>
          <div style={{ color: pnl >= 0 ? '#1ca97c' : '#d7263d', fontWeight: 700 }}>
            {pnl >= 0 ? '수익' : '손실'}: {pnl.toFixed(2)}$ ({pnlPercent.toFixed(2)}%)
          </div>
          <button
            onClick={closePosition}
            style={{
              background: '#3db2ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '7px 0',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 8,
              width: '100%',
              fontSize: 15
            }}
          >포지션 청산</button>
        </div>
      )}
    </div>
  );
});

export default PositionPanel;
