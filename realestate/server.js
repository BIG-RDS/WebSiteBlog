const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = '917b3e0dec8442b0a8510864bea67ec5';
const REAL_ESTATE_API = 'https://rt-api.re.go.kr/RealEstateService/SaleList';

app.get('/api/realestate', async (req, res) => {
  try {
    const { districtCode, dealYM } = req.query;

    if (!districtCode) {
      return res.status(400).json({ error: '구/시 코드가 필요합니다' });
    }

    const queryMonth = dealYM || getLastMonth();

    const response = await axios.get(REAL_ESTATE_API, {
      params: {
        LAWD_CD: districtCode,
        DEAL_YM: queryMonth,
        apikey: API_KEY
      },
      timeout: 10000
    });

    res.json(response.data);
  } catch (error) {
    console.error('API 오류:', error.message);
    res.status(500).json({ 
      error: '데이터 조회 실패',
      message: error.message 
    });
  }
});

function getLastMonth() {
  const today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();

  if (month === 0) {
    month = 12;
    year--;
  } else {
    month--;
  }

  return year + String(month).padStart(2, '0');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('프록시 서버 실행 중: http://localhost:' + PORT);
});