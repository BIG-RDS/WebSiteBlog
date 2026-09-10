#!/usr/bin/env node

const http = require('http');
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

function normalizeOrigin(origin) {
  if (!origin) {
    return '';
  }

  try {
    return new URL(origin).origin;
  } catch (error) {
    return '';
  }
}

function buildAllowedOrigins() {
  const configuredOrigins = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(function(origin) {
      return normalizeOrigin(origin.trim());
    })
    .filter(Boolean);
  const allowedOrigins = new Set(configuredOrigins);

  allowedOrigins.add('https://big-rds.github.io');
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
  allowedOrigins.add('http://localhost:8000');
  allowedOrigins.add('http://127.0.0.1:8000');

  return allowedOrigins;
}

function setCorsHeaders(req, res) {
  const requestOrigin = normalizeOrigin(req.headers.origin);
  const allowedOrigins = buildAllowedOrigins();

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getUpstreamError(data) {
  const responseData = data && data.response;
  const header = responseData && responseData.header;
  const resultCode = String(
    (header && (header.resultCode || header.returnReasonCode || header.code)) || ''
  ).trim();

  if (!resultCode || resultCode === '00' || resultCode === '0' || resultCode.toUpperCase() === 'SUCCESS') {
    return null;
  }

  const message =
    (header && (header.resultMsg || header.returnAuthMsg || header.message)) ||
    '부동산원 API가 오류를 반환했습니다';

  return { resultCode, message };
}

function sendJson(req, res, statusCode, body) {
  setCorsHeaders(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function handleRealEstateRequest(req, searchParams, res) {
  const districtCode = searchParams.get('districtCode');
  const dealYM = searchParams.get('dealYM');
  const apiKey = process.env.REAL_ESTATE_API_KEY;

  if (!districtCode) {
    sendJson(req, res, 400, { error: '구/시 코드가 필요합니다' });
    return;
  }

  if (!apiKey) {
    sendJson(req, res, 500, { error: 'REAL_ESTATE_API_KEY 환경변수가 설정되지 않았습니다' });
    return;
  }

  try {
    const queryMonth = dealYM || getLastMonth();
    const requestUrl = new URL(REAL_ESTATE_API);

    requestUrl.searchParams.set('LAWD_CD', districtCode);
    requestUrl.searchParams.set('DEAL_YM', queryMonth);
    requestUrl.searchParams.set('apikey', apiKey);

    console.log(`📍 요청: 지역코드=${districtCode}, 거래월=${queryMonth}`);

    const response = await fetch(requestUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`부동산원 API 응답 오류: ${response.status}`);
    }

    const xml = await response.text();
    const data = parser.parse(xml);
    const upstreamError = getUpstreamError(data);

    if (upstreamError) {
      throw new Error(`${upstreamError.message} (${upstreamError.resultCode})`);
    }

    console.log('✅ 부동산원 API 응답 수신');
    sendJson(req, res, 200, data);
  } catch (error) {
    console.error('❌ API 오류:', error.message);
    sendJson(req, res, 500, {
      error: '데이터 조회 실패',
      message: error.message
    });
  }
}

// Render 포트 설정
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(req, res, 405, { error: 'GET 요청만 지원합니다' });
    return;
  }

  if (requestUrl.pathname === '/') {
    sendJson(req, res, 200, {
      status: '✅ 부동산원 API 프록시 서버 정상 작동중',
      version: '1.0.0'
    });
    return;
  }

  if (requestUrl.pathname === '/api/realestate') {
    handleRealEstateRequest(req, requestUrl.searchParams, res).catch(function(error) {
      console.error('❌ API 오류:', error.message);
      sendJson(req, res, 500, {
        error: '데이터 조회 실패',
        message: error.message
      });
    });
    return;
  }

  sendJson(req, res, 404, { error: '요청한 경로를 찾을 수 없습니다' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 프록시 서버 실행 중: PORT ${PORT}`);
  console.log('🌐 API 엔드포인트: /api/realestate');
});