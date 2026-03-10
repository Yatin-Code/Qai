import sqlite3, feedparser, requests, json, sys, os
from bs4 import BeautifulSoup
from processor import run_processor_pipeline
from database import get_db_connection

# Ensure output is visible
sys.stdout.reconfigure(line_buffering=True)

def test():
    url = 'https://openai.com/blog/rss.xml'
    print(f"DEBUG: Fetching {url}")
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
        print(f"DEBUG: Found {len(feed.entries)} entries")
    except Exception as e:
        print(f"DEBUG: Fetch Error: {e}")
        return

    conn = get_db_connection()
    src = conn.execute('SELECT id FROM sources WHERE url=?', (url,)).fetchone()
    source_id = src['id'] if src else 0
    conn.close()
    print(f"DEBUG: Source ID for OpenAI: {source_id}")

    items = []
    for entry in feed.entries[:5]:
        raw_html = entry.get('summary', entry.get('description', ''))
        soup = BeautifulSoup(raw_html, 'html.parser')
        img = soup.find('img')
        image_url = img['src'] if img else ''
        items.append({
            'source_id': source_id,
            'url': entry.link,
            'title': entry.title,
            'raw_text': soup.get_text(),
            'category': 'TECH',
            'image_url': image_url
        })
    
    print("DEBUG: Calling run_processor_pipeline...")
    run_processor_pipeline(items)
    print("DEBUG: Test script finished.")

if __name__ == "__main__":
    test()
