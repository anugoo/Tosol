# Scrapers (separate from production `package/`)

This folder keeps **all scraping code** in one place, so you can open and run it
independently from the production inference bundle in `package/`.

## Install

```bash
cd scrapers
pip install -r requirements.txt
```

## panz.mn (JSON API)

```bash
python panz_scraper.py --groups apartment_rent,apartment_sale,house_sale --max-pages 50 --page-size 100 --output panz_realty.csv
```

Rental-only (tries to reach a target count; may stop earlier if the category has fewer ads):

```bash
python scrape_rentals_panz.py --target-rows 10000 --page-size 100 --max-pages 1500 --output rent_listings_panz.csv
```

## my-zar.mn (HTML parsing)

```bash
python myzar_scraper.py --groups apartment_rent,apartment_sale,house_sale --max-pages 500 --target-rows 10000 --output myzar_realty.csv
```

Notes:

- my-zar category URLs can change. Update `CATEGORY_URLS` inside `myzar_scraper.py` if needed.
- Scraping should respect site terms and request rate limits.

Ашиглах:

cd /Users/teyji/teyji.developer/webscrapping/scrapers
pip install -r requirements.txt
python myzar_scraper.py --groups apartment_rent,apartment_sale,house_sale --max-pages 200 --target-rows 5000 --output myzar_realty.csv
python panz_scraper.py --groups apartment_rent,house_rent --max-pages 50 --page-size 100 --output panz_realty.csv
