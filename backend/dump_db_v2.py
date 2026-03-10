import sqlite3
import os

DB_PATH = '/home/yat/qai/backend/qai.db'
OUTPUT_PATH = '/home/yat/qai/backend/db_dump_v2.txt'

def dump_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    with open(OUTPUT_PATH, 'w') as f:
        f.write("DB Dump V2\n")
        f.write("=============\n")
        
        # Insights with images
        cursor.execute("SELECT title, image_url, signal_strength FROM insights WHERE image_url IS NOT NULL AND image_url != '' ORDER BY id DESC LIMIT 50;")
        insights = cursor.fetchall()
        f.write(f"Insights with Images Count: {len(insights)}\n")
        for i in insights:
            f.write(f"[{i['signal_strength']}] {i['title']}\n")
            f.write(f"Image: {i['image_url']}\n")
            f.write("---\n")
            
    conn.close()

if __name__ == "__main__":
    dump_db()
