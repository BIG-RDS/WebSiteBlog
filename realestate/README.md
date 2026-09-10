# 부동산 실거래가 조회 시스템

## 개요

이 페이지는 GitHub Actions가 매일 수집한 부동산원 데이터를 정적 JSON 파일로 읽습니다.
이제 별도의 Vercel 서버리스 함수나 로컬 프록시 서버가 필요하지 않습니다.

## 데이터 흐름

1. GitHub Actions 워크플로우(`.github/workflows/fetch-realestate.yml`)가 매일 실행됩니다.
2. Python 스크립트(`scripts/fetch_realestate.py`)가 주요 지역의 실거래가 데이터를 수집합니다.
3. 지역별 JSON 파일이 `.github/data/realestate-<districtCode>.json`에 저장됩니다.
4. 요약 매니페스트가 `.github/data/realestate-data.json`에 저장됩니다.
5. `realestate/index.html`은 현재 배포된 사이트 기준 경로(`/.github/data/realestate-<districtCode>.json`)에서 해당 JSON 파일을 직접 불러옵니다.

## 필요한 저장소 설정

GitHub Actions에서 실데이터를 수집하려면 저장소 **Secrets and variables → Actions**에 아래 secret을 추가하세요.

- `REALESTATE_API_KEY`: 부동산원 API 키

secret이 설정되지 않아도 저장소에는 초기 샘플 JSON 파일이 포함되어 있으며, 워크플로우도 샘플 데이터를 다시 생성해 정적 페이지 구조를 유지합니다.

## 수동 실행

GitHub 저장소의 **Actions → Fetch real estate data → Run workflow**에서 즉시 데이터를 갱신할 수 있습니다. secret이 없으면 실데이터 대신 샘플 JSON이 다시 생성됩니다.

## 생성 파일 구조

```text
.github/
├── data/
│   ├── realestate-data.json
│   ├── realestate-11010.json
│   ├── realestate-11020.json
│   └── ...
└── workflows/
    └── fetch-realestate.yml
```

## 로컬 샘플 데이터 재생성

```bash
python scripts/fetch_realestate.py --sample-only
```

## 참고

- GitHub Actions는 변경된 데이터가 있을 때만 `.github/data` 경로를 커밋합니다.
- API 호출에 실패한 지역은 기존 JSON 파일을 유지해서 페이지가 비지 않도록 처리합니다.
