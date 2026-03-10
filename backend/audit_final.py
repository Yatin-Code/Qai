import sqlite3
DB_PATH = '/home/yat/qai/backend/qai.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT id, title, image_url, signal_strength FROM insights WHERE image_url LIKE '%unsplash%' OR image_url LIKE '%replicate%' ORDER BY id DESC LIMIT 50")
rows = cursor.fetchall()
with open('db_status_v2.txt', 'w') as f:
    f.write(f"Found {len(rows)} diversified insights.\n")
    for r in rows:
        f.write(f"ID: {r[0]}, Title: {r[1][:30]}, Signal: {r[3]}, Image: {r[2][:50]}...\n")
conn.close()
