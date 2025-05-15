// 프록시 URL 설정
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
const UPBIT_URL = 'https://api.upbit.com/v1';

// 차트 관련 변수
let chart;
let candleSeries;
let currentInterval = '1'; // 기본 1분봉

// Upbit API 호출 함수
async function fetchUpbit(endpoint) {
    try {
        const response = await fetch(PROXY_URL + UPBIT_URL + endpoint, {
            headers: {
                'Origin': window.location.origin,
            }
        });
        return await response.json();
    } catch (error) {
        console.error('API 호출 실패:', error);
        throw error;
    }
}

// 숫자 포맷팅 함수
function formatKRW(number) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(number);
}

// 차트 초기화 함수
function initChart() {
    const container = document.getElementById('chart-container');
    
    chart = LightweightCharts.createChart(container, {
        layout: {
            background: { color: '#1E222D' },
            textColor: '#DDD',
        },
        grid: {
            vertLines: { color: '#2B2B43' },
            horzLines: { color: '#2B2B43' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: '#2B2B43',
        },
        timeScale: {
            borderColor: '#2B2B43',
            timeVisible: true,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#34c759',
        downColor: '#ff3b30',
        borderUpColor: '#34c759',
        borderDownColor: '#ff3b30',
        wickUpColor: '#34c759',
        wickDownColor: '#ff3b30',
    });

    // 볼륨 시리즈 추가
    const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', // 별도의 축 사용하지 않음
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });

    function handleResize() {
        chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight,
        });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return { candleSeries, volumeSeries };
}

// 캔들 데이터 가져오기
async function fetchCandleData(interval) {
    try {
        let unit = 'minutes';
        let count = 200;
        let queryInterval = 1;

        switch(interval) {
            case '1': queryInterval = 1; break;
            case '5': queryInterval = 5; break;
            case '15': queryInterval = 15; break;
            case '60': queryInterval = 60; break;
            case '240': queryInterval = 240; break;
            case 'D': 
                unit = 'days';
                queryInterval = 1;
                break;
        }

        const data = await fetchUpbit(`/candles/${unit}/${queryInterval}?market=KRW-BTC&count=${count}`);
        
        return data.map(d => ({
            time: new Date(d.candle_date_time_kst).getTime() / 1000,
            open: d.opening_price,
            high: d.high_price,
            low: d.low_price,
            close: d.trade_price
        })).reverse();

    } catch (error) {
        console.error('캔들 데이터 로딩 실패:', error);
        return [];
    }
}

// 현재가 업데이트
async function updateCurrentPrice() {
    try {
        const [data] = await fetchUpbit('/ticker?markets=KRW-BTC');
        
        // 현재가 업데이트
        document.getElementById('current-price').textContent = formatKRW(data.trade_price);
        
        // 변화율 업데이트
        const changeRate = data.signed_change_rate * 100;
        const changeElement = document.getElementById('price-change');
        changeElement.textContent = `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(2)}%`;
        changeElement.className = `change ${changeRate >= 0 ? 'positive' : 'negative'}`;
        
        // 24시간 고가/저가/거래량 업데이트
        document.getElementById('high-24h').textContent = formatKRW(data.high_price);
        document.getElementById('low-24h').textContent = formatKRW(data.low_price);
        document.getElementById('volume-24h').textContent = formatKRW(data.acc_trade_price_24h);

    } catch (error) {
        console.error('가격 업데이트 실패:', error);
    }
}

// 타임프레임 변경 처리
async function handleIntervalChange(interval) {
    currentInterval = interval;
    const data = await fetchCandleData(interval);
    candleSeries.setData(data);
    
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.interval === interval) {
            btn.classList.add('active');
        }
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // CORS 프록시 서버 활성화 요청
    try {
        await fetch(PROXY_URL + 'https://api.upbit.com', { 
            headers: { 'Origin': window.location.origin }
        });
    } catch (error) {
        alert('CORS 프록시 서버 활성화가 필요합니다. OK를 클릭하면 활성화 페이지로 이동합니다.');
        window.open('https://cors-anywhere.herokuapp.com/corsdemo');
        return;
    }

    // 차트 초기화
    const { candleSeries: series } = initChart();
    candleSeries = series;
    
    // 초기 데이터 로드
    await handleIntervalChange('1');
    
    // 타임프레임 버튼 이벤트 리스너
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const interval = btn.dataset.interval;
            handleIntervalChange(interval);
        });
    });
    
    // 실시간 가격 업데이트
    updateCurrentPrice();
    setInterval(updateCurrentPrice, 1000);
});