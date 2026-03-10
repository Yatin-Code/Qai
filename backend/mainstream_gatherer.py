import sqlite3
import requests
import feedparser # We'll need to pip install this, it's safer for RSS than raw BeautifulSoup
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')

# The big 30 mainstream outlets (A subset to start)
MAINSTREAM_FEEDS = [
    {"name": "NYT Technology", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"},
    {"name": "NYT Business", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"},
    {"name": "NYT Politics", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
    {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml"},
    {"name": "Wired", "url": "https://www.wired.com/feed/rss"},
    {"name": "Wall Street Journal Tech", "url": "https://feeds.a.dj.com/rss/RSSWSJD.xml"},
    {"name": "Wall Street Journal Business", "url": "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml"},
    {"name": "CNBC Tech", "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=10000366"},
    {"name": "Reuters Tech", "url": "https://www.reutersagency.com/feed/?best-topics=tech&post_type=best"},
    {"name": "Bloomberg", "url": "https://feeds.bloomberg.com/crypto/news.rss"} # Bloomberg is tricky, this is a proxy
]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def gather_mainstream_headlines():
    """Pulls thousands of mainstream headlines to build our Radar Ledger."""
    print(f"📡 Sweeping Mainstream Media... [{datetime.now()}]")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total_added = 0
    
    for feed in MAINSTREAM_FEEDS:
        print(f"  -> Parsing {feed['name']}...")
        try:
            parsed_feed = feedparser.parse(feed['url'])
            # Most RSS feeds have the latest 20-50 items
            for entry in parsed_feed.entries:
                headline = entry.get('title', '').strip()
                link = entry.get('link', '')
                
                if not headline:
                    continue
                    
                try:
                    # Ignore the semantic_vector_blob for now, we'll let processor handle text matching 
                    # or compute it later if we want DB side matching. 
                    # For performance, we save the text, and processor.py encodes it on the fly or caches it
                    cursor.execute('''
                        INSERT INTO mainstream_ledger (outlet_name, headline, url)
                        VALUES (?, ?, ?)
                    ''', (feed['name'], headline, link))
                    total_added += 1
                except sqlite3.IntegrityError:
                    # UNIQUE constraint failed, headline already exists
                    pass
            
            conn.commit()
        except Exception as e:
            print(f"  ❌ Failed to parse {feed['name']}: {e}")
            
    conn.close()
    print(f"✅ Mainstream Sweep Complete. Added {total_added} new unique headlines to the Radar Ledger.")

if __name__ == "__main__":
    gather_mainstream_headlines()
