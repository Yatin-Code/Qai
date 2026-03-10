import sqlite3
import random
try:
    conn = sqlite3.connect('qai.db')
    cursor = conn.cursor()
    url = f"http://test-{random.random()}.com"
    cursor.execute("INSERT INTO insights (title, summary, url, category, signal_strength, image_url) VALUES (?,?,?,?,?,?)", 
                   ('Test Title', 'Test Summary', url, 'TECH', 50, 'https://placehold.co/600x400'))
    conn.commit()
    print('Manual Insertion Success')
except Exception as e:
    print('Manual Insertion Error:', e)
finally:
    if 'conn' in locals():
        conn.close()
