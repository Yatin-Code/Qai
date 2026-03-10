import requests
import feedparser
import sqlite3
import os
from bs4 import BeautifulSoup
from processor import run_processor_pipeline

def test():
    url = "https://openai.com/blog/rss.xml"
    print(f"Fetching {url}...")
    resp = requests.get(url, timeout=10)
    feed = feedparser.parse(resp.content)
    print(f"Found {len(feed.entries)} entries.")
    
    items = []
    for entry in feed.entries[:3]:
        # Try to find an image in summary or content
        raw_html = ""
        if 'summary' in entry: raw_html += entry.summary
        if 'content' in entry: raw_html += entry.content[0].value
        
        soup = BeautifulSoup(raw_html, 'html.parser')
        img = soup.find('img')
        image_url = img['src'] if img else ""
        
        # If no image found in HTML, check if there is an enclosure
        if not image_url and 'links' in entry:
            for link in entry.links:
                if 'image' in link.get('type', ''):
                    image_url = link.href
                    break
        
        print(f"Entry: {entry.title[:30]} | Image: {image_url[:50]}")
        
        items.append({
            'source_id': 1, # Placeholder
            'url': entry.link,
            'title': entry.title,
            'raw_text': soup.get_text()[:1000],
            'category': 'TECH',
            'image_url': image_url
        })
    
    print("Running processor...")
    run_processor_pipeline(items)

if __name__ == "__main__":
    test()
