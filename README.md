# All About the World 🌍

세상의 모든 정보를 큐레이션하는 정적 웹사이트입니다. **주식(종목분석)**, **여행** 등 카테고리별로
글을 예쁘게 정리해서 보여주며, GitHub Pages로 바로 배포할 수 있도록 구성되어 있습니다.

- 사이트명: All About the World
- 도메인(연결 예정): `airsky.com`
- 문의 이메일: `ikgyubae@gmail.com`

## 폴더 구조

```
.
├── index.html          # 홈페이지 (모든 카테고리의 최신 글)
├── contact.html         # 이메일 문의 폼
├── style.css            # 전체 스타일 (반응형 포함)
├── script.js             # 데이터 로딩, 검색/필터, 폼 처리 등 공통 로직
├── _config.yml          # GitHub Pages 설정
├── data/
│   ├── stocks.json      # 주식(종목분석) 글 데이터
│   └── travel.json      # 여행 글 데이터
├── stock/
│   ├── index.html       # 주식 목록 페이지
│   └── post.html        # 주식 글 상세 페이지 (?slug= 로 글 지정)
└── travel/
    ├── index.html       # 여행 목록 페이지
    └── post.html         # 여행 글 상세 페이지 (?slug= 로 글 지정)
```

## 새로운 글 추가하는 방법

이 사이트는 **JSON 기반 콘텐츠 관리 구조**를 사용합니다. 새 HTML 파일을 만들 필요 없이,
`data/stocks.json` 또는 `data/travel.json`에 객체 하나만 추가하면 목록/홈페이지/상세 페이지에
자동으로 반영됩니다.

### 주식(종목분석) 글 추가 예시 (`data/stocks.json`)

```json
{
  "slug": "lg-energy-solution",
  "title": "LG에너지솔루션 (373220) 종목 분석",
  "ticker": "373220",
  "category": "stock",
  "summary": "한 줄 요약",
  "image": "https://example.com/image.jpg",
  "tags": ["2차전지", "대형주"],
  "date": "2026-08-20",
  "link": "https://finance.naver.com/item/main.naver?code=373220",
  "content": [
    "분석 내용 문단 1",
    "분석 내용 문단 2"
  ]
}
```

### 여행 글 추가 예시 (`data/travel.json`)

```json
{
  "slug": "gyeongju",
  "title": "경주 여행 가이드",
  "location": "대한민국 경주",
  "category": "travel",
  "summary": "한 줄 요약",
  "image": "https://example.com/image.jpg",
  "tags": ["역사", "당일치기"],
  "date": "2026-08-22",
  "link": "https://example.com",
  "content": [
    "여행 정보 문단 1",
    "여행 정보 문단 2"
  ]
}
```

`slug`는 URL에 사용되는 고유 값이므로 영문/숫자/하이픈으로 겹치지 않게 작성하세요.

## 새로운 카테고리 추가하는 방법 (예: 뉴스)

1. `data/news.json` 파일을 만들고 위와 같은 형식으로 글 데이터를 작성합니다.
2. `news/index.html`, `news/post.html`을 `stock/` 폴더의 파일을 복사해서 만들고 문구만 변경합니다.
3. `script.js`의 `CATEGORIES` 객체에 아래처럼 항목을 추가합니다.

   ```js
   news: {
     label: "뉴스",
     dataUrl: "data/news.json",
     listPath: "news/index.html",
     postPath: "news/post.html",
   },
   ```

4. `style.css`에 `.badge.news` 색상이 이미 정의되어 있으니 그대로 사용하거나 원하는 색으로 변경하세요.
5. 각 페이지의 네비게이션(`<nav class="site-nav">`)에 새 카테고리 링크를 추가합니다.

## 로컬에서 미리보기

브라우저 보안 정책(CORS) 때문에 `file://`로 직접 열면 JSON 데이터를 불러오지 못할 수 있습니다.
간단한 로컬 서버를 띄워서 확인하세요.

```bash
python3 -m http.server 8000
# 이후 브라우저에서 http://localhost:8000 접속
```

## GitHub Pages 배포

1. 저장소 **Settings → Pages** 메뉴로 이동합니다.
2. Source를 `Deploy from a branch`로 설정하고, 브랜치는 `main`(또는 배포용 브랜치), 폴더는 `/root`를 선택합니다.
3. 저장하면 `https://<username>.github.io/<repository>/` 주소로 사이트가 배포됩니다.

## 커스텀 도메인(airsky.com) 연결 방법

1. **도메인 DNS 설정** (도메인 구매처, 예: 가비아/후이즈/GoDaddy 등에서):
   - `A` 레코드 4개를 `@`(루트 도메인)에 추가하고 아래 GitHub Pages IP를 입력합니다.
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - `www` 서브도메인을 사용하려면 `CNAME` 레코드로 `www` → `<username>.github.io`를 추가합니다.
2. **GitHub 저장소 설정**:
   - 저장소 루트에 `CNAME` 파일을 생성하고 내용에 `airsky.com`만 입력합니다.
   - 또는 **Settings → Pages → Custom domain**에 `airsky.com`을 입력하고 저장합니다.
3. DNS 전파에는 몇 분~최대 24시간 정도 소요될 수 있습니다. 전파가 완료되면 GitHub Pages 설정 화면에서
   `Enforce HTTPS` 옵션을 켜서 HTTPS 인증서를 자동으로 적용하세요.

> ⚠️ DNS가 아직 `airsky.com`을 가리키지 않는 상태에서 `CNAME` 파일을 먼저 추가하면 사이트에
> 일시적으로 접근이 안 될 수 있으니, DNS 레코드를 먼저 설정한 뒤 `CNAME` 파일을 추가하는 것을 권장합니다.

## 문의

이메일 문의 폼(`contact.html`)을 통해 `ikgyubae@gmail.com`으로 메시지를 보낼 수 있습니다.
