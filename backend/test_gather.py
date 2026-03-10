import sqlite3
import feedparser
from bs4 import BeautifulSoup
from processor import run_processor_pipeline
from database import get_db_connection

def gather_test():
    gathered_items = []
    url = "https://openai.com/blog/rss.xml"
    feed = feedparser.parse(url)
    for entry in feed.entries[:3]:
        raw_html = entry.get('summary', entry.get('description', ''))
        raw_soup = BeautifulSoup(raw_html, "html.parser")
        img_tag = raw_soup.find('img')
        
        image_url = ''
        if img_tag and img_tag.has_attr('src'):
            image_url = img_tag['src']
        elif hasattr(entry, 'media_content') and len(entry.media_content) > 0:
            image_url = entry.media_content[0].get('url', '')
        elif hasattr(entry, 'media_thumbnail') and len(entry.media_thumbnail) > 0:
            image_url = entry.media_thumbnail[0].get('url', '')
            
        clean_text = raw_soup.get_text(separator=' ', strip=True)
        if not clean_text:
            clean_text = entry.get('title', '')
        
        # We need a valid source ID. Let's get OpenAI from sources or insert it
        conn = get_db_connection()
        src = conn.execute("SELECT id FROM sources WHERE url=?", (url,)).fetchone()
        
        if src:
            source_id = src['id']
        else:
            cur = conn.cursor()
            cur.execute("INSERT INTO sources (name, url, category) VALUES (?,?,?)", ("OpenAI", url, "TECH"))
            conn.commit()
            source_id = cur.lastrowid
        conn.close()

        gathered_items.append({
            'source_id': source_id,
            'url': entry.get('link', url),
            'title': entry.get('title', ''),
            'raw_text': clean_text,
            'category': 'TECH',
            'image_url': image_url
        })
    print("Found items: ", len(gathered_items))
    for g in gathered_items:
        print("Image URL Extracted: ", g['image_url'])
    run_processor_pipeline(gathered_items)

if __name__ == "__main__":
    gather_test()
