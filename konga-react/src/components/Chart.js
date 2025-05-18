import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const TIMEFRAMES = [
  { label: '1m', value: { unit: 'minutes', interval: 1 } },
  { label: '5m', value: { unit: 'minutes', interval: 5 } },
  { label: '15m', value: { unit: 'minutes', interval: 15 } },
  { label: '1h', value: { unit: 'minutes', interval: 60 } },
  { label: '4h', value: { unit: 'minutes', interval: 240 } },
  { label: '1d', value: { unit: 'days', interval: 1 } },
];

function Chart({ theme }) {
  const chartContainerRef = useRef();
  const [data, setData] = useState([]);
  const [currentTimeframe, setCurrentTimeframe] = useState(TIMEFRAMES[0]);
  const [tooltip, setTooltip] = useState(null);

  // 캔들 데이터 가져오기
  async function fetchCandleData(timeframe = currentTimeframe) {
    const { unit, interval } = timeframe.value;
    const response = await fetch(
      `http://localhost:4000/api/candles/${unit}/${interval}?market=KRW-BTC&count=100`
    );
    let result = await response.json();

    if (!result || (Array.isArray(result) && result.length === 0)) {
      setData([]);
      return;
    }
    if (!Array.isArray(result)) {
      result = [result];
    }

    const chartData = result
      .map(d => ({
        time: Math.floor(new Date(d.candle_date_time_kst).getTime() / 1000),
        open: d.opening_price,
        high: d.high_price,
        low: d.low_price,
        close: d.trade_price,
      }))
      .reverse();
    setData(chartData);
  }

  useEffect(() => {
    fetchCandleData();
    const interval = setInterval(() => fetchCandleData(), 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [currentTimeframe]);

  useEffect(() => {
    if (!data.length) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
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

    const candleSeries = chart.addCandlestickSeries({
      upColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      downColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
      borderUpColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      borderDownColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
      wickUpColor: theme === 'dark' ? '#34c759' : '#1ca97c',
      wickDownColor: theme === 'dark' ? '#ff3b30' : '#d7263d',
    });

    candleSeries.setData(data);

    chart.subscribeCrosshairMove(param => {
      if (
        !param ||
        param.time === undefined ||
        !param.seriesPrices ||
        typeof param.seriesPrices.get !== 'function'
      ) {
        setTooltip(null);
        return;
      }
      const price = param.seriesPrices.get(candleSeries);
      if (!price || !param.point) {
        setTooltip(null);
        return;
      }
      setTooltip({
        time: param.time,
        ...price,
        x: param.point.x,
        y: param.point.y,
      });
    });

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, theme]);

  return (
    <div style={{ position: 'relative' }}>
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
          height: '500px',
          margin: '0 auto',
          borderRadius: '12px',
          background: theme === 'dark' ? '#393E46' : '#B3C8CF',
        }}
      />
      {/* 툴팁 */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(tooltip.x + 20, 0), (chartContainerRef.current?.clientWidth || 600) - 120),
            top: Math.min(Math.max(tooltip.y, 0), 500 - 100),
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
    </div>
  );
}

export default Chart;
