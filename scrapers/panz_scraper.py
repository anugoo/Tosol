"""Quick scraper for panz.mn real-estate listings (rent/sale) using the public JSON API.

Usage:
  python panz_scraper.py --max-pages 50 --page-size 100 --output panz_realty.csv

Groups:
  apartment_sale, apartment_rent, house_sale, house_rent
"""

from __future__ import annotations

import argparse
import csv
import random
import time
from typing import Dict, Iterable, Iterator, List

import requests

BASE = "https://www.panz.mn"
API_LIST = f"{BASE}/api/ad/list"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; panz-collector/1.0)",
}

# Category IDs derived from sitemap (page.xml) at the time this project was built.
CATEGORY_GROUPS: Dict[str, List[int]] = {
    # Орон сууц зарна
    "apartment_sale": [669, 670, 671],
    # Орон сууц түрээслүүлнэ
    "apartment_rent": [674, 687, 688, 691],
    # Хашаа байшин, гэр зарна
    "house_sale": [617, 659],
    # Хашаа байшин, зуслан, нийтийн байр түрээслүүлнэ
    "house_rent": [675, 676, 677],
}


def fetch_page(category_id: int, page: int, size: int) -> dict:
    params = {"page": page, "categoryId": category_id, "size": size}
    resp = requests.get(API_LIST, params=params, headers=HEADERS, timeout=25)
    resp.raise_for_status()
    return resp.json()


def pick_attr(attrs: List[dict], key: str) -> str:
    for item in attrs or []:
        attr = item.get("attribute") or {}
        if attr.get("path") == key:
            return item.get("val") or ""
    return ""


def iter_ads(groups: Iterable[str], max_pages: int, page_size: int) -> Iterator[dict]:
    for group in groups:
        cat_ids = CATEGORY_GROUPS.get(group, [])
        for cid in cat_ids:
            page = 0
            while page <= max_pages:
                data = fetch_page(cid, page, page_size)
                ads = data.get("ads") or []
                if not ads:
                    break

                for ad in ads:
                    attrs = ad.get("attributes") or []
                    yield {
                        "source": "panz.mn",
                        "group": group,
                        "category_id": ad.get("category", {}).get("id"),
                        "category_name": ad.get("category", {}).get("name"),
                        "ad_id": ad.get("id"),
                        "title": ad.get("name"),
                        "price_mnt": ad.get("price"),
                        "city": ad.get("city", {}).get("name"),
                        "district": ad.get("district", {}).get("name"),
                        "location_label": pick_attr(attrs, "locationApart")
                        or pick_attr(attrs, "locationHouse")
                        or pick_attr(attrs, "location"),
                        "square_m2": pick_attr(attrs, "square") or pick_attr(attrs, "landSquare"),
                        "published": ad.get("published"),
                        "url": f"{BASE}/zar/{ad.get('id')}-{ad.get('nameLatin')}",
                    }

                page += 1
                time.sleep(random.uniform(0.6, 1.6))


def write_csv(rows: Iterable[dict], output_path: str) -> None:
    rows = list(rows)
    if not rows:
        print("No data collected.")
        return
    fieldnames = list(rows[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} rows -> {output_path}")


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Scrape panz.mn realty listings via JSON API")
    ap.add_argument(
        "--groups",
        default="apartment_sale,apartment_rent,house_sale,house_rent",
        help=f"Comma-separated groups. Available: {','.join(CATEGORY_GROUPS.keys())}",
    )
    ap.add_argument("--max-pages", type=int, default=50, help="Pages per category")
    ap.add_argument("--page-size", type=int, default=100, help="Ads per page")
    ap.add_argument("--output", default="panz_realty.csv")
    return ap.parse_args()


def main() -> None:
    args = parse_args()
    selected = [g.strip() for g in args.groups.split(",") if g.strip()]
    unknown = [g for g in selected if g not in CATEGORY_GROUPS]
    if unknown:
        raise SystemExit(f"Unknown groups: {unknown}")
    rows = iter_ads(selected, int(args.max_pages), int(args.page_size))
    write_csv(rows, args.output)


if __name__ == "__main__":
    main()


