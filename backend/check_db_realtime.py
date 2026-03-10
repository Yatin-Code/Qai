import sqlite3
DB_PATH = '/home/yat/qai/backend/qai.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT id, title, image_url, signal_strength FROM insights ORDER BY id DESC LIMIT 10")
rows = cursor.fetchall()
for r in rows:
    print(f"ID: {r[0]}, Title: {r[1][:30]}, Signal: {r[3]}, Image: {r[2]}")
conn.close()
