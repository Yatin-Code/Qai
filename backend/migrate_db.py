import sqlite3
import os

DB_PATH = '/home/yat/qai/backend/qai.db'

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(insights)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'full_content' not in columns:
        print("Adding 'full_content' column...")
        cursor.execute("ALTER TABLE insights ADD COLUMN full_content TEXT")
        
    if 'sentiment_reasoning' not in columns:
        print("Adding 'sentiment_reasoning' column...")
        cursor.execute("ALTER TABLE insights ADD COLUMN sentiment_reasoning TEXT")
        
    conn.commit()
    conn.close()
    print("✅ Migration complete.")

if __name__ == "__main__":
    migrate()
