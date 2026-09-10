#!/usr/bin/env python3
import argparse
import json
import os
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

API_URL = 'https://rt-api.re.go.kr/RealEstateService/SaleList'
DATA_DIR = Path('.github/data')
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; GitHubActions/1.0; +https://github.com/big-rds/WebSiteBlog)'
}

LOCATIONS = {
    '11': {
        'name': '서울',
        'districts': {
            '11010': '종로구', '11020': '중구', '11030': '용산구', '11040': '성동구', '11050': '광진구',
            '11060': '동대문구', '11070': '중랑구', '11080': '성북구', '11090': '강북구', '11100': '도봉구',
            '11110': '노원구', '11120': '은평구', '11130': '서대문구', '11140': '마포구', '11150': '양천구',
            '11160': '강서구', '11170': '구로구', '11180': '금천구', '11190': '영등포구', '11200': '동작구',
            '11210': '관악구', '11220': '서초구', '11230': '강남구', '11240': '송파구', '11250': '강동구'
        }
    },
    '26': {
        'name': '부산',
        'districts': {
            '26110': '중구', '26140': '서구', '26170': '동구', '26200': '영도구', '26230': '부산진구',
            '26260': '동래구', '26290': '남구', '26320': '북구', '26350': '해운대구', '26380': '사상구',
            '26410': '금정구', '26440': '강서구', '26710': '연제구', '26740': '수영구', '26770': '사하구',
            '26800': '기장군'
        }
    },
    '41': {
        'name': '경기',
        'districts': {
            '41131': '수원시', '41135': '성남시', '41189': '안양시', '41205': '부천시', '41210': '광명시',
            '41220': '평택시', '41230': '동두천시', '41240': '안산시', '41250': '고양시', '41260': '과천시',
            '41270': '구리시', '41280': '남양주시', '41290': '오산시', '41300': '시흥시', '41310': '군포시',
            '41320': '의왕시', '41330': '하남시', '41340': '용인시', '41350': '파주시', '41360': '이천시',
            '41370': '안성시', '41380': '김포시', '41390': '화성시', '41400': '광주시', '41410': '여주시'
        }
    },
    '42': {
        'name': '강원',
        'districts': {
            '42110': '춘천시', '42130': '원주시', '42150': '강릉시', '42170': '동해시',
            '42190': '태백시', '42210': '속초시', '42230': '삼척시'
        }
    }
}

SAMPLE_TRANSACTIONS = {
    '41135': [
        {'type': 'A', 'dealType': '매매', 'address': '위례 1차 아파트', 'price': 50000, 'area': 120, 'date': '20260831'},
        {'type': 'A', 'dealType': '전세', 'address': '위례 2차 아파트', 'price': 30000, 'area': 130, 'date': '20260830'},
        {'type': 'A', 'dealType': '월세', 'address': '위례 3차 아파트', 'price': 2500, 'area': 115, 'date': '20260829'},
        {'type': 'H', 'dealType': '매매', 'address': '위례 단독주택', 'price': 35000, 'area': 100, 'date': '20260828'},
        {'type': 'A', 'dealType': '매매', 'address': '위례 프리미엄 아파트', 'price': 65000, 'area': 145, 'date': '20260827'},
        {'type': 'A', 'dealType': '전세', 'address': '위례 센트럴 아파트', 'price': 28000, 'area': 125, 'date': '20260826'},
        {'type': 'V', 'dealType': '월세', 'address': '위례 빌라', 'price': 2800, 'area': 110, 'date': '20260825'},
        {'type': 'H', 'dealType': '전세', 'address': '위례 타운하우스', 'price': 25000, 'area': 105, 'date': '20260824'}
    ]
}


def build_districts():
    districts = []
    for province_code, province in LOCATIONS.items():
        for district_code, district_name in province['districts'].items():
            districts.append({
                'provinceCode': province_code,
                'provinceName': province['name'],
                'districtCode': district_code,
                'districtName': district_name,
            })
    return districts


DISTRICTS = build_districts()


def get_last_month_deal_ym(now=None):
    now = now or datetime.now(timezone.utc)
    year = now.year
    month = now.month - 1
    if month == 0:
        year -= 1
        month = 12
    return f'{year}{month:02d}'


def get_text(node, tag_name):
    child = node.find(tag_name)
    return child.text.strip() if child is not None and child.text else ''


def to_int(value):
    digits = ''.join(ch for ch in (value or '') if ch.isdigit())
    return int(digits) if digits else 0


def to_float(value):
    try:
        return float((value or '').replace(',', '').strip())
    except ValueError:
        return 0.0


def normalize_date(year, month, day):
    if not year:
        return ''
    return f'{to_int(year):04d}{to_int(month):02d}{to_int(day):02d}'


def normalize_transaction(item):
    return {
        'type': 'A',
        'dealType': '매매',
        'address': get_text(item, '아파트') or get_text(item, '지번') or '미정',
        'price': to_int(get_text(item, '거래금액')),
        'area': to_float(get_text(item, '전용면적') or get_text(item, '건물면적')),
        'date': normalize_date(get_text(item, '년'), get_text(item, '월'), get_text(item, '일')),
        'floor': to_int(get_text(item, '층')) or None,
        'builtYear': to_int(get_text(item, '건축년도')) or None,
    }


def fetch_transactions(district_code, deal_ym, api_key):
    query = urlencode({'LAWD_CD': district_code, 'DEAL_YM': deal_ym, 'apikey': api_key})
    request = Request(f'{API_URL}?{query}', headers=REQUEST_HEADERS)
    with urlopen(request, timeout=20) as response:
        payload = response.read().decode('utf-8', errors='replace')
    root = ET.fromstring(payload)
    items = [normalize_transaction(item) for item in root.findall('.//item')]
    items = [item for item in items if item['address'] and item['price'] > 0]
    items.sort(key=lambda item: (item.get('date', ''), item.get('price', 0), item.get('address', '')), reverse=True)
    return items


def build_payload(district, deal_ym, updated_at, transactions, source, error=None):
    payload = {
        'provinceCode': district['provinceCode'],
        'provinceName': district['provinceName'],
        'districtCode': district['districtCode'],
        'districtName': district['districtName'],
        'dealYM': deal_ym,
        'updatedAt': updated_at,
        'source': source,
        'transactionCount': len(transactions),
        'transactions': transactions,
    }
    if error:
        payload['lastError'] = error
    return payload


def sample_payload(district, deal_ym, updated_at):
    sample_transactions = deepcopy(SAMPLE_TRANSACTIONS.get(district['districtCode'], []))
    return build_payload(district, deal_ym, updated_at, sample_transactions, 'sample')


def district_path(district_code):
    return DATA_DIR / f'realestate-{district_code}.json'


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def load_existing_payload(district_code):
    path = district_path(district_code)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding='utf-8'))


def build_manifest(payloads, updated_at, deal_ym):
    return {
        'updatedAt': updated_at,
        'dealYM': deal_ym,
        'districtCount': len(payloads),
        'districts': [
            {
                'provinceCode': payload['provinceCode'],
                'provinceName': payload['provinceName'],
                'districtCode': payload['districtCode'],
                'districtName': payload['districtName'],
                'transactionCount': payload.get('transactionCount', 0),
                'updatedAt': payload.get('updatedAt', updated_at),
                'source': payload.get('source', 'unknown'),
                'file': f"realestate-{payload['districtCode']}.json",
            }
            for payload in payloads
        ]
    }


def generate_sample_files(deal_ym, updated_at):
    payloads = []
    for district in DISTRICTS:
        payload = sample_payload(district, deal_ym, updated_at)
        write_json(district_path(district['districtCode']), payload)
        payloads.append(payload)
    write_json(DATA_DIR / 'realestate-data.json', build_manifest(payloads, updated_at, deal_ym))
    return payloads


def fetch_and_write_files(api_key, deal_ym, updated_at):
    payloads = []
    failures = []

    for district in DISTRICTS:
        try:
            transactions = fetch_transactions(district['districtCode'], deal_ym, api_key)
            payload = build_payload(district, deal_ym, updated_at, transactions, 'remote')
            write_json(district_path(district['districtCode']), payload)
        except Exception as exc:  # noqa: BLE001
            existing = load_existing_payload(district['districtCode'])
            if existing is None:
                payload = sample_payload(district, deal_ym, updated_at)
                payload['source'] = 'sample-fallback'
                payload['lastSyncAttemptAt'] = updated_at
                payload['lastError'] = str(exc)
                write_json(district_path(district['districtCode']), payload)
            else:
                payload = {
                    **existing,
                    'provinceCode': district['provinceCode'],
                    'provinceName': district['provinceName'],
                    'districtCode': district['districtCode'],
                    'districtName': district['districtName'],
                    'source': 'stale',
                    'lastSyncAttemptAt': updated_at,
                    'lastError': str(exc),
                    'transactionCount': len(existing.get('transactions', [])),
                }
                write_json(district_path(district['districtCode']), payload)
            failures.append(f"{district['districtCode']} {district['districtName']}: {exc}")
        payloads.append(payload)

    write_json(DATA_DIR / 'realestate-data.json', build_manifest(payloads, updated_at, deal_ym))
    return failures


def parse_args():
    parser = argparse.ArgumentParser(description='Fetch Korean real estate data and write static JSON files.')
    parser.add_argument('--sample-only', action='store_true', help='Write placeholder sample JSON files without calling the API.')
    parser.add_argument('--deal-ym', help='Override deal year-month (YYYYMM). Defaults to the previous month.')
    return parser.parse_args()


def main():
    args = parse_args()
    updated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    deal_ym = args.deal_ym or get_last_month_deal_ym()

    if args.sample_only:
        generate_sample_files(deal_ym, updated_at)
        print(f'Wrote sample real estate JSON files to {DATA_DIR}')
        return 0

    api_key = os.getenv('REALESTATE_API_KEY', '').strip()
    if not api_key:
        print('REALESTATE_API_KEY is required for live fetches.', file=sys.stderr)
        return 1

    failures = fetch_and_write_files(api_key, deal_ym, updated_at)
    if failures:
        print('Completed with fallback data for some districts:', file=sys.stderr)
        for failure in failures:
            print(f' - {failure}', file=sys.stderr)
    else:
        print(f'Fetched real estate data for {len(DISTRICTS)} districts.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
