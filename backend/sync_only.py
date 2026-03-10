import sqlite3
import csv
import os
import sys

# Ensure output is visible
sys.stdout.reconfigure(line_buffering=True)

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')
LEDGER_PATH = os.path.join(os.path.dirname(__file__), 'ledger.csv')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def sync():
    print(f"Starting sync from {LEDGER_PATH} to {DB_PATH}")
    if not os.path.exists(LEDGER_PATH):
        print("Error: ledger.csv not found")
        return
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Re-create table just in case
    cursor.execute('CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, category TEXT NOT NULL, is_active BOOLEAN DEFAULT 1, last_checked DATETIME)')
    
    with open(LEDGER_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            try:
                cursor.execute('INSERT INTO sources (name, url, category, is_active) VALUES (?, ?, ?, 1)', 
                             (row['name'], row['url'], row['category'].upper()))
                count += 1
            except sqlite3.IntegrityError:
                pass
            except Exception as e:
                print(f"Row Error: {e}")
    conn.commit()
    conn.close()
    print(f"Synced {count} new sources.")

if __name__ == "__main__":
    sync()
