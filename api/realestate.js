const axios = require('axios');
const cors = require('micro-cors')();

const API_KEY = '917b3e0dec8442b0a8510864bea67ec5';
const REAL_ESTATE_API = 'https://rt-api.re.go.kr/RealEstateService/SaleList';

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

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { districtCode, dealYM } = req.query;

    if (!districtCode) {
      return res.status(400).json({ error: '구/시 코드가 필요합니다' });
    }

    const queryMonth = dealYM || getLastMonth();

    console.log(`📍 요청: 지역코드=${districtCode}, 거래월=${queryMonth}`);

    const response = await axios.get(REAL_ESTATE_API, {
      params: {
        LAWD_CD: districtCode,
        DEAL_YM: queryMonth,
        apikey: API_KEY
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('✅ 부동산원 API 응답 수신');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ API 오류:', error.message);
    res.status(500).json({ 
      error: '데이터 조회 실패',
      message: error.message 
    });
  }
}

module.exports = cors(handler);