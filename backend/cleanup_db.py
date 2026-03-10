import sqlite3
import os

DB_PATH = '/home/yat/qai/backend/qai.db'

def cleanup_images():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Reset images that are clearly repetitive fallbacks or SVGs
    cursor.execute('''
        UPDATE insights 
        SET image_url = '' 
        WHERE image_url LIKE '%.svg' 
           OR image_url LIKE '%huggingface.co%'
           OR image_url = ''
    ''')
    
    # We'll leave existing specific Unsplash or news-sourced images unless they are duplicates
    # For now, let's just clear many to force a re-render/re-fill (if we were to re-process)
    # Actually, let's just DELETE all insights so we get a completely fresh set with the new logic
    # cursor.execute('DELETE FROM insights') 
    
    print(f"✅ Cleaned up repetitive images from {cursor.rowcount} entries.")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    cleanup_images()
