import requests
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def gather_huggingface_models():
    """Fetches trending/new models from Hugging Face."""
    print(f"🤗 Scanning Hugging Face APIs... [{datetime.now()}]")
    
    # We look for models sorted by recent downloads to find newly popular items
    # or just recently created items with a text-generation tag
    url = "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=20&filter=text-generation"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        models = response.json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Pre-tokenize mainstream headlines for the radar
        from processor import tokenize, calculate_mainstream_radar
        pre_tokenized_mainstream = []
        try:
            mainstream_headlines = cursor.execute('SELECT headline FROM mainstream_ledger').fetchall()
            for row in mainstream_headlines:
                tokens = tokenize(row['headline'])
                if tokens:
                    pre_tokenized_mainstream.append(tokens)
        except Exception:
            pass

        total_added = 0
        
        for model in models:
            model_id = model.get('id', '')
            if not model_id:
                continue
                
            downloads = model.get('downloads', 0)
            
            # Simple heuristic: if it has decent downloads it's a signal
            if downloads < 500:
                continue
                
            title = model_id
            url = f"https://huggingface.co/{model_id}"
            category = "RESEARCH"
            
            # We don't have the full text, so we'll use a summary string
            tags = ", ".join(model.get('tags', [])[:5])
            raw_text = f"New trending model on Hugging Face: {model_id}. Tags: {tags}. Downloads: {downloads}."
            
            # We'll allow the processor to determine the best visual later
            # based on model specifics or keywords
            image_url = "" 
            
            item = {
                'title': title,
                'raw_text': raw_text,
                'category': category,
                'url': url,
                'image_url': image_url
            }
            
            from processor import process_item_heuristics
            insight, processed_by = process_item_heuristics(item)
            
            if not insight or not insight.get('is_signal'):
                continue
                
            if downloads > 10000:
                insight['signal_strength'] = min(100, insight['signal_strength'] + 20)
                
            # HF models are usually under the radar early on
            insight_tokens = tokenize(insight['title'])
            is_mainstream = calculate_mainstream_radar(insight_tokens, item['url'], pre_tokenized_mainstream)
            
            try:
                # We need a source_id. Let's create an artificial one for HF API or look one up.
                cursor.execute('SELECT id FROM sources WHERE url LIKE "%huggingface%" LIMIT 1')
                source_row = cursor.fetchone()
                
                if not source_row:
                    # Create HF source if it doesn't exist
                    cursor.execute('''
                        INSERT INTO sources (name, url, category, is_active)
                        VALUES (?, ?, ?, 1)
                    ''', ("Hugging Face API", "https://huggingface.co", "RESEARCH"))
                    conn.commit()
                    source_id = cursor.lastrowid
                else:
                    source_id = source_row['id']
                    
                cursor.execute('''
                    INSERT INTO insights (source_id, title, summary, url, category, signal_strength, is_mainstream, image_url, is_breaking, vip_quote, processed_by, sentiment, entities)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    source_id, 
                    insight['title'], 
                    insight['summary'], 
                    item['url'], 
                    insight['category'], 
                    insight['signal_strength'], 
                    1 if is_mainstream else 0,
                    item.get('image_url', ''),
                    1 if insight.get('is_breaking') else 0,
                    insight.get('vip_quote', ''),
                    "HF API " + processed_by,
                    insight.get('sentiment', 'Neutral'),
                    insight.get('entities', '[]')
                ))
                total_added += 1
            except sqlite3.IntegrityError:
                pass # Already ingested
                
        conn.commit()
        conn.close()
        print(f"✅ HF Sweep Complete. Added {total_added} new models to the Radar.")
        
    except Exception as e:
        print(f"❌ Failed to reach Hugging Face API: {e}")

if __name__ == "__main__":
    gather_huggingface_models()
