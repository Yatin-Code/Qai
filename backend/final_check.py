import sqlite3
import os

DB_PATH = '/home/yat/qai/backend/qai.db'
OUTPUT_PATH = '/home/yat/qai/backend/db_final_check.txt'

def dump_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    with open(OUTPUT_PATH, 'w') as f:
        # Hero Check
        cursor.execute("SELECT COUNT(*) as cnt FROM insights WHERE signal_strength >= 90;")
        hero_count = cursor.fetchone()['cnt']
        f.write(f"Hero Stories (Signal >= 90): {hero_count}\n")
        
        # Recent check
        cursor.execute("SELECT title, image_url, signal_strength FROM insights ORDER BY id DESC LIMIT 50;")
        insights = cursor.fetchall()
        for i in insights:
            f.write(f"[{i['signal_strength']}] {i['title']}\n")
            f.write(f"Image: {i['image_url']}\n")
            f.write("---\n")
            
    conn.close()

if __name__ == "__main__":
    dump_db()
