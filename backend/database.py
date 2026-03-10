import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table to store the primary sources we scrape
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            last_checked DATETIME
        )
    ''')

    # Table to store extracted raw facts and AI summaries
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            signal_strength INTEGER,
            is_mainstream BOOLEAN DEFAULT 0,
            image_url TEXT,
            is_breaking BOOLEAN DEFAULT 0,
            vip_quote TEXT,
            processed_by TEXT,
            sentiment TEXT DEFAULT 'Neutral',
            entities TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES sources (id)
        )
    ''')

    # The Strong Mainstream Radar table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mainstream_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            outlet_name TEXT NOT NULL,
            headline TEXT NOT NULL UNIQUE,
            url TEXT,
            semantic_vector_blob BLOB,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Qai Database Initialized Successfully at:", DB_PATH)

if __name__ == '__main__':
    init_db()
