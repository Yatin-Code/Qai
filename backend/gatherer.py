import sqlite3
import csv
import os
import feedparser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from datetime import datetime
from processor import run_processor_pipeline

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')
LEDGER_PATH = os.path.join(os.path.dirname(__file__), 'ledger.csv')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def sync_ledger_to_db():
    print(f"🔄 Syncing {LEDGER_PATH} to SQLite...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    with open(LEDGER_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor.execute('''
                    INSERT INTO sources (name, url, category, is_active)
                    VALUES (?, ?, ?, 1)
                ''', (row['name'], row['url'], row['category'].upper()))
            except sqlite3.IntegrityError:
                pass
    conn.commit()
    conn.close()

def gather_data():
    conn = get_db_connection()
    sources = conn.execute('SELECT * FROM sources WHERE is_active = 1').fetchall()
    conn.close()
    
    gathered_items = []
    print(f"📡 Starting primary gather sweep of {len(sources)} sources at {datetime.now()}...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        page = context.new_page()

        for source in sources:
            url = source['url']
            print(f"  -> Scraping: {source['name']} ({url})")
            
            # YouTube or standard RSS Feeds
            if 'rss' in url.lower() or 'xml' in url.lower() or 'feed' in url.lower():
                try:
                    import requests
                    resp = requests.get(url, timeout=10)
                    resp.raise_for_status()
                    feed = feedparser.parse(resp.content)
                    
                    # Limit ArXiv spam: 4 items for ArXiv, 15 for others
                    item_limit = 4 if 'arxiv.org' in url.lower() else 15
                    entries = feed.entries[:item_limit]
                    
                    for entry in entries:
                        raw_html = entry.get('summary', entry.get('description', ''))
                        raw_soup = BeautifulSoup(raw_html, "html.parser")
                        img_tag = raw_soup.find('img')
                        
                        image_url = ''
                        # 1. Search in RSS entry media extensions
                        if hasattr(entry, 'media_content') and len(entry.media_content) > 0:
                            image_url = entry.media_content[0].get('url', '')
                        elif hasattr(entry, 'media_thumbnail') and len(entry.media_thumbnail) > 0:
                            image_url = entry.media_thumbnail[0].get('url', '')
                        elif hasattr(entry, 'links'):
                            for link in entry.links:
                                if 'image' in link.get('type', ''):
                                    image_url = link.get('href', '')
                                    break
                        
                        # 2. Search in raw HTML content of the entry
                        if not image_url:
                            img_tag = raw_soup.find('img')
                            if img_tag and img_tag.has_attr('src'):
                                image_url = img_tag['src']
                        
                        # Resolve relative URLs
                        if image_url and (image_url.startswith('/') or not image_url.startswith('http')):
                            from urllib.parse import urljoin
                            image_url = urljoin(entry.get('link', url), image_url)
                            
                        clean_text = raw_soup.get_text(separator=' ', strip=True)
                        if not clean_text:
                            clean_text = entry.get('title', '')
                        
                        # Check if URL already exists in insights to save credits
                        conn_check = get_db_connection()
                        exists = conn_check.execute('SELECT 1 FROM insights WHERE url = ?', (entry.get('link', url),)).fetchone()
                        conn_check.close()
                        
                        if exists:
                            continue

                        gathered_items.append({
                            'source_id': source['id'],
                            'url': entry.get('link', url),
                            'title': entry.get('title', ''),
                            'raw_text': clean_text,
                            'category': source['category'],
                            'image_url': image_url
                        })
                except Exception as e:
                    print(f"     ❌ RSS parse failed for {source['name']}: {e}")
                    
            # Complex JS-Heavy Websites (Playwright headless Chromium)
            else:
                try:
                    # Check if URL already exists in insights to save credits
                    conn_check = get_db_connection()
                    exists = conn_check.execute('SELECT 1 FROM insights WHERE url = ?', (url,)).fetchone()
                    conn_check.close()
                    
                    if exists:
                        continue

                    page.goto(url, timeout=15000, wait_until="domcontentloaded")
                    html = page.content()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    image_url = ''
                    # Priority: og:image -> twitter:image -> first large img
                    meta_og = soup.find('meta', property='og:image')
                    meta_twitter = soup.find('meta', name='twitter:image')
                    
                    if meta_og and meta_og.get('content'):
                        image_url = meta_og['content']
                    elif meta_twitter and meta_twitter.get('content'):
                        image_url = meta_twitter['content']
                    else:
                        # Fallback to first image tag
                        img_tag = soup.find('img')
                        if img_tag and img_tag.has_attr('src'):
                            image_url = img_tag['src']
                    
                    if image_url and (image_url.startswith('/') or not image_url.startswith('http')):
                        from urllib.parse import urljoin
                        image_url = urljoin(url, image_url)
                    
                    for ext in soup(['script', 'style', 'nav', 'footer', 'header']):
                        ext.decompose()
                        
                    clean_text = soup.get_text(separator=' ', strip=True)
                    clean_text = clean_text[:3000] # Truncate to save LLM context window
                    
                    gathered_items.append({
                        'source_id': source['id'],
                        'url': url,
                        'title': page.title(),
                        'raw_text': clean_text,
                        'category': source['category'],
                        'image_url': image_url
                    })
                except Exception as e:
                    print(f"     ❌ Playwright scrape failed for {source['name']}: {e}")
                    
        browser.close()

    print(f"✅ Gather sweep complete. Found {len(gathered_items)} raw items. Handing off to AI Processor...")
    if gathered_items:
        run_processor_pipeline(gathered_items)
    else:
        print("   No items to process.")

if __name__ == "__main__":
    sync_ledger_to_db()
    gather_data()
