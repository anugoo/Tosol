"""Scrape my-zar.mn listings (HTML parsing).

This is a lightweight scraper that collects listing cards from category pages.
It does NOT visit each detail page (faster / safer).

Run:
  python myzar_scraper.py --groups apartment_rent,apartment_sale,house_sale --max-pages 500 --target-rows 10000 --output myzar_realty.csv
"""

from __future__ import annotations

import argparse
import csv
import random
import time
from typing import Dict, Iterator, List, Optional, Set

import requests
from bs4 import BeautifulSoup

BASE = "https://www.my-zar.mn"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; myzar-collector/1.0)"}

# Known good category URLs (can change over time; update if needed)
CATEGORY_URLS: Dict[str, str] = {
    "apartment_sale": f"{BASE}/zaruud/1801",
    "apartment_rent": f"{BASE}/zaruud/1803",
    "house_sale": f"{BASE}/zaruud/600-hashaa-baishin-zarna",
    # NOTE: house_rent categories on my-zar change and some slugs were found to be noisy.
    # Add your own mapping if you confirm the correct category URL.
}


def fetch_html(url: str, timeout_s: int) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=timeout_s)
    resp.raise_for_status()
    return resp.text


def parse_cards(html: str, group: str) -> List[dict]:
    soup = BeautifulSoup(html, "html.parser")
    out: List[dict] = []
    for a in soup.select("a.my-ad-card"):
        title_el = a.select_one(".my-ad-card__name")
        price_el = a.select_one(".my-ad-card__price")
        date_el = a.select_one(".my-ad-card__published span")
        if not title_el:
            continue
        out.append(
            {
                "group": group,
                "title": title_el.get_text(strip=True),
                "price_text": price_el.get_text(strip=True) if price_el else "",
                "published": date_el.get_text(strip=True) if date_el else "",
                "url": BASE + (a.get("href") or ""),
            }
        )
    return out


def iter_groups(
    groups: List[str],
    *,
    max_pages: int,
    target_rows: int,
    min_sleep: float,
    max_sleep: float,
    timeout_s: int,
) -> Iterator[dict]:
    seen_urls: Set[str] = set()
    n = 0
    for group in groups:
        base_url: Optional[str] = CATEGORY_URLS.get(group)
        if not base_url:
            print(f"Skip unknown group: {group}")
            continue
        for page in range(1, max_pages + 1):
            url = f"{base_url}?page={page}" if page > 1 else base_url
            html = fetch_html(url, timeout_s=timeout_s)
            rows = parse_cards(html, group)
            if not rows:
                break
            new_on_page = 0
            for r in rows:
                u = r.get("url") or ""
                if u and u not in seen_urls:
                    seen_urls.add(u)
                    new_on_page += 1
                    yield r
                    n += 1
                    if n >= target_rows:
                        return
            if new_on_page == 0:
                break
            time.sleep(random.uniform(min_sleep, max_sleep))


def write_csv(rows: Iterator[dict], output_path: str) -> int:
    fieldnames = ["group", "title", "price_text", "published", "url"]
    n = 0
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
            n += 1
    return n


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Scrape my-zar.mn listing cards")
    ap.add_argument(
        "--groups",
        default="apartment_sale,apartment_rent,house_sale",
        help=f"Comma-separated groups. Available: {','.join(CATEGORY_URLS.keys())}",
    )
    ap.add_argument("--max-pages", type=int, default=200)
    ap.add_argument("--target-rows", type=int, default=10_000)
    ap.add_argument("--min-sleep", type=float, default=0.6)
    ap.add_argument("--max-sleep", type=float, default=1.2)
    ap.add_argument("--timeout-s", type=int, default=25)
    ap.add_argument("--output", default="myzar_realty.csv")
    return ap.parse_args()


def main() -> None:
    a = parse_args()
    groups = [g.strip() for g in a.groups.split(",") if g.strip()]
    n = write_csv(
        iter_groups(
            groups,
            max_pages=int(a.max_pages),
            target_rows=int(a.target_rows),
            min_sleep=float(a.min_sleep),
            max_sleep=float(a.max_sleep),
            timeout_s=int(a.timeout_s),
        ),
        a.output,
    )
    print(f"Wrote {n} rows -> {a.output}")


if __name__ == "__main__":
    main()


