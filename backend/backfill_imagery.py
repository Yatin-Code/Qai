import sqlite3
import os
from visualizer import get_contextual_image

DB_PATH = '/home/yat/qai/backend/qai.db'

def backfill():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Force find all empty images
    cursor.execute('''
        SELECT id, title, summary, category, signal_strength, image_url 
        FROM insights 
        WHERE image_url = '' 
           OR image_url IS NULL
           OR image_url LIKE '%.svg'
           OR image_url LIKE '%huggingface.co%'
    ''')
    
    items = cursor.fetchall()
    print(f"Force backfilling {len(items)} items...")
    
    for item in items:
        new_img = get_contextual_image(
            item['title'], 
            item['summary'], 
            item['category'], 
            item['signal_strength']
        )
        if new_img:
            cursor.execute('UPDATE insights SET image_url = ? WHERE id = ?', (new_img, item['id']))

    conn.commit()
    conn.close()
    print("Backfill done.")

if __name__ == "__main__":
    backfill()
