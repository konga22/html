const express = require('express');
const cors = require('cors');
const axios = require('axios');

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
