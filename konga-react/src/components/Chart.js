import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import isEqual from "lodash.isequal";
import { timeParse } from "d3-time-format";


const TIMEFRAMES = [
  { label: '1m', value: { unit: 'minutes', interval: 1 } },
  { label: '5m', value: { unit: 'minutes', interval: 5 } },
  { label: '15m', value: { unit: 'minutes', interval: 15 } },
  { label: '1h', value: { unit: 'minutes', interval: 60 } },
  { label: '4h', value: { unit: 'minutes', interval: 240 } },
  { label: '1d', value: { unit: 'days', interval: 1 } },
];

const parseDate = timeParse("%Y-%m-%dT%H:%M:%S");

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

function Chart({ theme, usdRate, setLastChartPrice }) {
  const chartContainerRef = useRef();
  const [data, setData] = useState([]);
  const [currentTimeframe, setCurrentTimeframe] = useState(TIMEFRAMES[0]);
  const [tooltip, setTooltip] = useState(null);

  // 차트와 시리즈 참조 저장
  const chartRef = useRef();
  const seriesRef = useRef();

  // 뷰포트 위치 저장용
  const lastRangeRef = useRef();

  // 1. 추천 전략 상태 추가
  const [strategy, setStrategy] = useState({ summary: '', detail: '' });

  // 예시: currentTimeframe.value.interval, currentTimeframe.value.unit 사용
  const intervalMap = {
    minutes: { 1: '1m', 5: '5m', 15: '15m', 60: '1h', 240: '4h' },
    days: { 1: '1d' }
  };
  const intervalStr = intervalMap[currentTimeframe.value.unit][currentTimeframe.value.interval];

  // 2. 전략 메시지 받아오는 useEffect 추가
  useEffect(() => {
    async function fetchStrategy() {
      const res = await fetch(`http://localhost:4000/api/strategy?interval=${intervalStr}`);
      const data = await res.json();
      setStrategy(data);
    }
    fetchStrategy();
    const interval = setInterval(fetchStrategy, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [intervalStr]);

  // 캔들 데이터 가져오기
  useEffect(() => {
    async function fetchGlobalCandleData() {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${intervalStr}&limit=100`);
      const result = await res.json();
      const chartData = result.map(d => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));
      setData(chartData);
      // 마지막 가격을 상위로 전달
      if (setLastChartPrice && chartData.length > 0) {
        setLastChartPrice(chartData[chartData.length - 1].close);
      }
    }
    fetchGlobalCandleData();
    const intervalId = setInterval(fetchGlobalCandleData, 3000);
    return () => clearInterval(intervalId);
  }, [intervalStr, setLastChartPrice]);

  useEffect(() => {
    if (!data.length) return;
    setTooltip(null);

    // 차트 생성
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: {
          color: theme === 'dark' ? '#393E46' : '#B3C8CF'
        },
        textColor: theme === 'dark' ? '#f5f6fa' : '#23263a',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#222831' : '#BCCCDC' },
        horzLines: { color: theme === 'dark' ? '#222831' : '#BCCCDC' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: theme === 'dark' ? '#222831' : '#BCCCDC' },
      timeScale: { borderColor: theme === 'dark' ? '#222831' : '#BCCCDC', timeVisible: true },
      handleScroll: {
        horzTouchDrag: true,
        vertTouchDrag: true,
        pressedMouseMove: true,
        mouseWheel: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      downColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
      borderUpColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      borderDownColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
      wickUpColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      wickDownColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
    });

    // 차트 뷰포트 변경 감지
    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
      lastRangeRef.current = range;
    });

    seriesRef.current.setData(data);

    seriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        minMove: 0.01,
        precision: 2,
      }
    });

    chartRef.current.subscribeCrosshairMove(param => {
      if (
        !param ||
        param.time === undefined ||
        !param.seriesPrices ||
        typeof param.seriesPrices.get !== 'function'
      ) {
        setTooltip(null);
        return;
      }
      const price = param.seriesPrices.get(seriesRef.current);
      if (!price || !param.point) {
        setTooltip(null);
        return;
      }
      // 반드시 이 줄이 콘솔에 찍히는지 확인!
      console.log('툴크 값:', {
        time: param.time,
        ...price,
        x: param.point.x,
        y: param.point.y,
      });
      setTooltip({
        time: param.time,
        ...price,
        x: param.point.x,
        y: param.point.y,
      });
    });

    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current.remove();
    };
  }, [data, theme]);

  useEffect(() => {
    // 데이터 갱신 시
    if (seriesRef.current) {
      seriesRef.current.setData(data);

      // 사용자가 맨 끝을 보고 있지 않으면, 이전 뷰포트로 복원
      if (lastRangeRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(lastRangeRef.current);
      }
    }
  }, [data]);

  return (
    <div style={{ position: 'relative', marginTop: '32px', marginBottom: '0' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.label}
            onClick={() => setCurrentTimeframe(tf)}
            style={{
              background: tf.label === currentTimeframe.label ? '#3db2ff' : '#23263a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: tf.label === currentTimeframe.label ? 700 : 400,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '400px',
          margin: '0 auto',
          borderRadius: '12px',
          background: theme === 'dark' ? '#393E46' : '#B3C8CF',
        }}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(tooltip.x + 20, 0), (chartContainerRef.current?.clientWidth || 600) - 120),
            top: Math.min(Math.max(tooltip.y, 0), 400 - 100),
            background: theme === 'dark' ? 'rgba(40,40,60,0.95)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#fff' : '#23263a',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 15,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
          }}
        >
          <div>시가: {tooltip.open}</div>
          <div>고가: {tooltip.high}</div>
          <div>저가: {tooltip.low}</div>
          <div>종가: {tooltip.close}</div>
        </div>
      )}
      {/* 추천 전략 안내글 */}
      <div style={{
        marginTop: 18,
        padding: '14px 18px',
        background: theme === 'dark' ? '#23263a' : '#e6ecf1',
        color: theme === 'dark' ? '#f5f6fa' : '#23263a',
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{ color: '#3db2ff', fontWeight: 700, marginBottom: 4 }}>추천 전략</span>
        <span
          dangerouslySetInnerHTML={{ __html: highlightKeywords(strategy.summary) }}
        />
        {strategy.detail && (
          <div style={{
            marginTop: 8,
            fontSize: 13,
            color: theme === 'dark' ? '#b0b8c1' : '#6b7684',
            fontWeight: 500,
            textAlign: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: strategy.detail }}
          />
        )}
        {strategy.buyJudgement && (
          <div style={{
            marginTop: 6,
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: strategy.buyJudgement }}
          />
        )}
      </div>
    </div>
  );
}



export default Chart;
