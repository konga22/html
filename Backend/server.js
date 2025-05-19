const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fetch = require('node-fetch');

const app = express();
const port = 4000;

// CORS 설정
app.use(cors());
app.use(express.json());

// Upbit API 엔드포인트
const UPBIT_URL = 'https://api.upbit.com/v1';

// 캔들스틱 데이터 가져오기
app.get('/api/candles/:unit/:interval', async (req, res) => {
    try {
        const { unit, interval } = req.params;
        const { market, count } = req.query;
        
        const response = await axios.get(`${UPBIT_URL}/candles/${unit}/${interval}`, {
            params: { market, count }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching candles:', error);
        res.status(500).json({ error: 'Failed to fetch candle data' });
    }
});

// 현재가 정보 가져오기
app.get('/api/ticker', async (req, res) => {
    try {
        const { markets } = req.query;
        const response = await axios.get(`${UPBIT_URL}/ticker`, {
            params: { markets }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching ticker:', error);
        res.status(500).json({ error: 'Failed to fetch ticker data' });
    }
});

// 이동평균 계산 함수
function sma(arr, period) {
  if (arr.length < period) return null;
  return arr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// RSI 계산 함수
function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (gains + losses === 0) return 50;
  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

app.get('/api/strategy', async (req, res) => {
  const interval = req.query.interval || '1h';
  const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=100`;
  const response = await fetch(url);
  const data = await response.json();
  const closes = data.map(d => parseFloat(d[4]));
  const lastClose = closes[closes.length - 1];
  const ma5 = sma(closes, 5);
  const ma20 = sma(closes, 20);
  const rsi14 = rsi(closes, 14);

  let summary = '';
  let detail = '';
  let buyJudgement = '';

  // 지정가 예시: 최근 종가보다 1% 낮은 가격
  const buyLimit = (lastClose * 0.99).toFixed(2);
  // 매도 목표가 예시: 최근 종가보다 2% 높은 가격
  const sellTarget = (lastClose * 1.02).toFixed(2);

  if (ma5 && ma20) {
    if (ma5 > ma20) {
      summary += `상승세 감지! <b>상승세</b> 구간입니다.`;
      detail += `
        <div>
          <span style="color:#1ca97c;font-weight:700;">[매수 전략]</span>
          <span style="font-size:13px;"> 지정가 <b>${buyLimit}달러</b>에서 자산의 20%씩 5회 분할 매수 추천</span>
        </div>
        <div>
          <span style="color:#d7263d;font-weight:700;">[매도 전략]</span>
          <span style="font-size:13px;"> 목표가 <b>${sellTarget}달러</b> 도달 시 자산의 20%씩 5회 분할 매도 권장</span>
        </div>
      `;
    } else if (ma5 < ma20) {
      summary += `하락세 감지! <b>하락세</b> 구간입니다.`;
      detail += `
        <div>
          <span style="color:#1ca97c;font-weight:700;">[매수 전략]</span>
          <span style="font-size:13px;"> 지정가 <b>${buyLimit}달러</b>에서 자산의 10%씩 10회 분할 매수 추천</span>
        </div>
        <div>
          <span style="color:#d7263d;font-weight:700;">[매도 전략]</span>
          <span style="font-size:13px;"> 목표가 <b>${sellTarget}달러</b> 도달 시 자산의 10%씩 10회 분할 매도 권장</span>
        </div>
      `;
    } else {
      summary += '이동평균선이 수렴 중입니다. 관망을 추천합니다.';
      detail += '';
    }
  }
  if (rsi14) {
    if (rsi14 > 70) summary += ' <b>과매수</b> 구간, <b>매도</b> 또는 관망 추천.';
    else if (rsi14 < 30) summary += ' <b>과매도</b> 구간, <b>매수</b> 또는 관망 추천.';
    else summary += ` RSI 중립(${rsi14.toFixed(1)})`;
  }

  // 현재가 기준 매수 진입 판단 메시지 추가
  if (lastClose > buyLimit) {
    buyJudgement = `<span style="font-size:13px;color:#3db2ff;">현재가(${lastClose.toFixed(2)}달러)가 지정가(${buyLimit}달러)보다 높으므로, 진입을 기다리세요.</span>`;
  } else {
    buyJudgement = `<span style="font-size:13px;color:#1ca97c;">현재가(${lastClose.toFixed(2)}달러)가 지정가(${buyLimit}달러)에 도달했습니다. 매수 진입 가능합니다.</span>`;
  }

  res.json({
    summary, // 시장 상황 요약
    detail,  // 구체적 매수/매도 전략
    buyJudgement, // 현재가 기준 매수 진입 판단
    updatedAt: new Date().toISOString()
  });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
