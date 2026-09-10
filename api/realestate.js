const { XMLParser } = require('fast-xml-parser');

const REAL_ESTATE_API = 'https://rt-api.re.go.kr/RealEstateService/SaleList';
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true
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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 지원합니다' });
  }

  try {
    const { districtCode, dealYM } = req.query;
    const apiKey = process.env.REAL_ESTATE_API_KEY;

    if (!districtCode) {
      return res.status(400).json({ error: '구/시 코드가 필요합니다' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'REAL_ESTATE_API_KEY 환경변수가 설정되지 않았습니다' });
    }

    const queryMonth = dealYM || getLastMonth();
    const requestUrl = new URL(REAL_ESTATE_API);

    requestUrl.searchParams.set('LAWD_CD', districtCode);
    requestUrl.searchParams.set('DEAL_YM', queryMonth);
    requestUrl.searchParams.set('apikey', apiKey);

    console.log(`📍 요청: 지역코드=${districtCode}, 거래월=${queryMonth}`);

    const response = await fetch(requestUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`부동산원 API 응답 오류: ${response.status}`);
    }

    const xml = await response.text();
    const data = parser.parse(xml);

    console.log('✅ 부동산원 API 응답 수신');
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ API 오류:', error.message);
    res.status(500).json({ 
      error: '데이터 조회 실패',
      message: error.message 
    });
  }
}

module.exports = handler;