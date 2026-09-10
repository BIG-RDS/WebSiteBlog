# 부동산 실거래가 조회 시스템

## 📋 설치 및 실행 방법

### 1️⃣ 프록시 서버 설치

```bash
cd realestate
npm install
export REAL_ESTATE_API_KEY=your-api-key
```

### 2️⃣ 프록시 서버 실행

```bash
export REAL_ESTATE_API_KEY=your-api-key
npm start
```

✅ 서버가 실행되면 다음 메시지가 출력됩니다:
```
프록시 서버 실행 중: http://localhost:3000
```

### 3️⃣ 브라우저에서 접속

```
http://localhost/realestate/index.html
```

또는 서버가 호스팅 중인 경우:
```
https://your-domain.com/realestate/index.html
```

---

## ▲ Vercel 배포 전 필수 설정

Vercel Serverless 함수(`../api/realestate.js`)는 `REAL_ESTATE_API_KEY` 환경변수를 사용합니다.

1. Vercel 프로젝트 생성 후 **Settings → Environment Variables** 로 이동
2. `REAL_ESTATE_API_KEY` 추가
3. GitHub Pages 외 다른 프론트엔드 도메인에서 호출할 경우 `ALLOWED_ORIGINS`에 허용할 Origin을 쉼표로 추가
4. Production / Preview / Development 환경에 모두 적용
5. 재배포 후 `https://<your-vercel-domain>/api/realestate?districtCode=11010` 로 확인

GitHub Pages에서 `realestate/index.html`을 계속 사용할 경우 아래 값을 실제 배포 URL로 바꾸세요.

```js
var DEPLOYED_PROXY_URL = 'https://REPLACE_WITH_YOUR_VERCEL_URL/api/realestate';
```

Vercel 도메인에서 페이지를 직접 열면 `/api/realestate`를 자동으로 사용합니다.

---

## 🔧 동작 원리

1. **프론트엔드** (`index.html`)
   - 사용자가 지역 선택 후 "최신정보가져오기" 클릭
   - `http://localhost:3000/api/realestate?districtCode=11010` 요청

2. **프록시 서버** (`server.js`)
   - 요청받은 지역코드로 부동산원 API 호출
   - XML 응답을 JSON으로 변환해서 반환

3. **브라우저**
   - JSON 데이터를 받아 테이블에 표시
   - 통계 계산 및 필터링

---

## ✅ 테스트 완료

✨ **경기도 성남시 예제:**
- 지난달 실거래 데이터 조회됨
- 최고가, 평균가, 총 건수 표시
- 필터링 기능 정상 작동

---

## 📝 API 엔드포인트

### GET `/api/realestate`

**파라미터:**
- `districtCode` (필수): 구/시 코드 (예: 11010)
- `dealYM` (선택): 거래 년월 (예: 202609, 기본값: 지난달)

**응답 예:**
```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "아파트": "래미안",
            "거래금액": "50000",
            "건물면적": "84.93",
            "년": 2026,
            "월": 8,
            "일": 15
          }
        ]
      }
    }
  }
}
```

---

## 🐛 문제 해결

### Q: "프록시 서버를 실행해주세요" 오류
**A:** 터미널에서 아래 명령어 실행:
```bash
cd realestate
npm install
export REAL_ESTATE_API_KEY=your-api-key
npm start
```

### Q: "연결 거부됨" 오류
**A:** 방화벽 설정 확인 (포트 3000 허용)

### Q: 데이터가 없음
**A:** 선택한 지역의 지난달에 거래가 없을 수 있음

---

## 📦 파일 구조

```
realestate/
├── index.html          # 프론트엔드 UI
├── server.js           # 프록시 서버
├── package.json        # 의존성 정의
└── README.md           # 이 파일
```

---

## 🎯 향후 개선 사항

- [ ] 월세/전세 데이터 추가
- [ ] 주택/빌라 데이터 지원
- [ ] 데이터베이스 저장
- [ ] 월별 추세 그래프
- [ ] 검색 필터 고급화
