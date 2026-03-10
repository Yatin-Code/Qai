import requests
import sqlite3
import os
from datetime import datetime
from processor import run_processor_pipeline

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def gather_hn_ai_news():
    """Uses Algolia HN API to find high-velocity trending AI discussions."""
    print(f"📡 Sweeping Hacker News for AI Trends... [{datetime.now()}]")
    
    # Query for Show HN and general AI keywords in the last 24h
    # sorted by popularity
    url = "https://hn.algolia.com/api/v1/search"
    params = {
        "query": "AI OR LLM OR AGI OR Agent OR Claude",
        "tags": "story",
        "numericFilters": "points>50", 
        "hitsPerPage": 20
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        gathered_items = []
        # Ensure we have a generic HN Source ID
        conn = get_db_connection()
        hn_source = conn.execute("SELECT id FROM sources WHERE name = 'Hacker News'").fetchone()
        
        if not hn_source:
             cursor = conn.cursor()
             cursor.execute("INSERT INTO sources (name, url, category, is_active) VALUES (?, ?, ?, 1)", ("Hacker News", "https://news.ycombinator.com", "TECH"))
             conn.commit()
             hn_source_id = cursor.lastrowid
        else:
             hn_source_id = hn_source['id']
        conn.close()

        for hit in data.get('hits', []):
            title = hit.get('title', '')
            url = hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            points = hit.get('points', 0)
            
            # Simple text extraction for HN (usually just title unless it's an Ask HN)
            raw_text = hit.get('story_text', '') or f"Hacker News discussion with {points} points."
            
            gathered_items.append({
                'source_id': hn_source_id,
                'url': url,
                'title': title,
                'raw_text': raw_text[:2000],
                'category': 'TECH',
                'image_url': '' # HN rarely provides clean OG images via this API
            })
            
        print(f"✅ Found {len(gathered_items)} high-traction AI posts on Hacker News. Happing off to AI Processor...")
        if gathered_items:
            run_processor_pipeline(gathered_items)
            
    except Exception as e:
        print(f"❌ Hacker News sweep failed: {e}")

if __name__ == "__main__":
    gather_hn_ai_news()
