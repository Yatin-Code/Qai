import requests
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'qai.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def gather_github_repos():
    """Fetches trending new AI/LLM repos from GitHub."""
    print(f"🐙 Scanning GitHub Search API... [{datetime.now()}]")
    
    # We look for repos created recently with AI keywords, sorted by stars
    # "created:>YYYY-MM-DD" + keywords: llm, RAG, agent, diffusion
    # For a live script, we'd dynamically generate the date for "last 7 days"
    # Here we just use a generic search for highly starred recent repos
    url = "https://api.github.com/search/repositories?q=llm+OR+rag+OR+agent+OR+diffusion+stars:>50&sort=updated&order=desc&per_page=20"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Qai-Radar-Bot"
    }
    
    # If the user has a GH token in env, use it to avoid rate limits
    gh_token = os.environ.get("GITHUB_TOKEN")
    if gh_token:
        headers["Authorization"] = f"token {gh_token}"
        
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        repos = data.get('items', [])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        total_added = 0
        from processor import process_item_heuristics, calculate_mainstream_radar
        
        for repo in repos:
            repo_name = repo.get('full_name', '')
            desc = repo.get('description', '') or ''
            stars = repo.get('stargazers_count', 0)
            url = repo.get('html_url', '')
            
            # Simple heuristic: strong signal if it's trending with stars
            if stars < 50:
                continue
                
            title = f"GitHub: {repo_name}"
            category = "TECH"
            
            raw_text = f"New highly starred repository: {repo_name}. Description: {desc}. Stars: {stars}."
            
            item = {
                'title': title,
                'raw_text': raw_text,
                'category': category,
                'url': url
            }
            
            insight, processed_by = process_item_heuristics(item)
            
            if not insight or not insight.get('is_signal'):
                continue
                
            # Boost signal strength for high star count
            if stars > 1000:
                insight['signal_strength'] = min(100, insight['signal_strength'] + 30)
            elif stars > 500:
                insight['signal_strength'] = min(100, insight['signal_strength'] + 15)
                
            is_mainstream = calculate_mainstream_radar(insight['title'])
            
            try:
                # We need a source_id.
                cursor.execute('SELECT id FROM sources WHERE url LIKE "%github.com%" LIMIT 1')
                source_row = cursor.fetchone()
                
                if not source_row:
                    cursor.execute('''
                        INSERT INTO sources (name, url, category, is_active)
                        VALUES (?, ?, ?, 1)
                    ''', ("GitHub Trending API", "https://github.com", "TECH"))
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
                    "GitHub API " + processed_by,
                    insight.get('sentiment', 'Neutral'),
                    insight.get('entities', '[]')
                ))
                total_added += 1
            except sqlite3.IntegrityError:
                pass # Already ingested
                
        conn.commit()
        conn.close()
        print(f"✅ GitHub Sweep Complete. Added {total_added} new repos to the Radar.")
        
    except Exception as e:
        print(f"❌ Failed to reach GitHub API: {e}")

if __name__ == "__main__":
    gather_github_repos()
