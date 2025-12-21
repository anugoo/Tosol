"""Scrape rental listings from panz.mn (tries to reach N rows).

Important:
- panz categories can have far fewer than 10k rental ads; this script will stop once
  pagination is exhausted.

Run:
  python scrape_rentals_panz.py --target-rows 10000 --page-size 100 --max-pages 1500 --output rent_listings_panz.csv
"""

from __future__ import annotations

import argparse
import csv
import random
import time
from dataclasses import dataclass
from typing import Dict, Iterator, List, Optional, Set

import requests

BASE = "https://www.panz.mn"
API_LIST = f"{BASE}/api/ad/list"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; rent-collector/1.0)",
}

# Rentals only
CATEGORY_GROUPS: Dict[str, List[int]] = {
    "apartment_rent": [674, 687, 688, 691],
    "house_rent": [675, 676, 677],
}


def pick_attr(attrs: List[dict], key: str) -> str:
    for item in attrs or []:
        attr = item.get("attribute") or {}
        if attr.get("path") == key:
            return item.get("val") or ""
    return ""


def fetch_page(category_id: int, page: int, size: int, timeout: int = 25) -> dict:
    params = {"page": page, "categoryId": category_id, "size": size}
    resp = requests.get(API_LIST, params=params, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def normalize_float(x: str | float | int | None) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip().replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None


@dataclass(frozen=True)
class ScrapeConfig:
    page_size: int
    max_pages: int
    target_rows: int
    min_sleep: float
    max_sleep: float
    max_retries: int


def iter_rent_ads(cfg: ScrapeConfig) -> Iterator[dict]:
    seen: Set[str] = set()
    collected = 0

    def mark(ad_id: object) -> bool:
        key = str(ad_id) if ad_id is not None else ""
        if not key or key in seen:
            return False
        seen.add(key)
        return True

    for group, cat_ids in CATEGORY_GROUPS.items():
        for cid in cat_ids:
            page = 0
            no_new_streak = 0
            while page <= cfg.max_pages and collected < cfg.target_rows:
                data = None
                for attempt in range(cfg.max_retries + 1):
                    try:
                        data = fetch_page(cid, page, cfg.page_size)
                        break
                    except requests.RequestException:
                        time.sleep(min(8.0, 0.5 * (2**attempt)))
                if data is None:
                    break

                ads = data.get("ads") or []
                if not ads:
                    break

                new_on_page = 0
                for ad in ads:
                    ad_id = ad.get("id")
                    if not mark(ad_id):
                        continue
                    new_on_page += 1
                    attrs = ad.get("attributes") or []
                    sqm = pick_attr(attrs, "square") or pick_attr(attrs, "landSquare") or ""
                    yield {
                        "source": "panz.mn",
                        "group": group,
                        "category_id": ad.get("category", {}).get("id"),
                        "category_name": ad.get("category", {}).get("name"),
                        "ad_id": ad_id,
                        "title": ad.get("name"),
                        "price_mnt": ad.get("price"),
                        "city": ad.get("city", {}).get("name"),
                        "district": ad.get("district", {}).get("name"),
                        "location_label": pick_attr(attrs, "locationApart")
                        or pick_attr(attrs, "locationHouse")
                        or pick_attr(attrs, "location"),
                        "square_m2": normalize_float(sqm),
                        "published": ad.get("published"),
                        "url": f"{BASE}/zar/{ad.get('id')}-{ad.get('nameLatin')}",
                    }
                    collected += 1
                    if collected >= cfg.target_rows:
                        break

                if new_on_page == 0:
                    no_new_streak += 1
                else:
                    no_new_streak = 0
                if no_new_streak >= 3:
                    break
                page += 1
                time.sleep(random.uniform(cfg.min_sleep, cfg.max_sleep))


def write_csv(rows: Iterator[dict], output_path: str) -> int:
    fieldnames = [
        "source",
        "group",
        "category_id",
        "category_name",
        "ad_id",
        "title",
        "price_mnt",
        "city",
        "district",
        "location_label",
        "square_m2",
        "published",
        "url",
    ]
    n = 0
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
            n += 1
    return n


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Scrape rentals from panz.mn")
    ap.add_argument("--target-rows", type=int, default=10_000)
    ap.add_argument("--page-size", type=int, default=100)
    ap.add_argument("--max-pages", type=int, default=1500)
    ap.add_argument("--min-sleep", type=float, default=0.6)
    ap.add_argument("--max-sleep", type=float, default=1.6)
    ap.add_argument("--max-retries", type=int, default=4)
    ap.add_argument("--output", default="rent_listings_panz.csv")
    return ap.parse_args()


def main() -> None:
    a = parse_args()
    cfg = ScrapeConfig(
        page_size=int(a.page_size),
        max_pages=int(a.max_pages),
        target_rows=int(a.target_rows),
        min_sleep=float(a.min_sleep),
        max_sleep=float(a.max_sleep),
        max_retries=int(a.max_retries),
    )
    n = write_csv(iter_rent_ads(cfg), a.output)
    print(f"Wrote {n} rows -> {a.output}")
    if n < cfg.target_rows:
        print(f"NOTE: target was {cfg.target_rows}, but categories ended earlier (only {n} rows available).")


if __name__ == "__main__":
    main()


