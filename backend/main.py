from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import sqlite3
import os
import requests
import asyncio
import json
import re
from bs4 import BeautifulSoup
from groq import Groq
import yfinance as yf
from database import DB_PATH

app = FastAPI(title="Qai API", description="The Command Center Backend")

# Allow Vite frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/insights")
def get_insights(category: Optional[str] = None, is_mainstream: Optional[bool] = None, timeframe: Optional[str] = None):
    """
    Returns the latest processed insights.
    If category is provided, filters by category.
    If is_mainstream is provided, filters by mainstream status.
    If timeframe is provided, filters by created_at (day, week, month).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT i.id, i.title, i.summary, i.url, i.category, i.signal_strength, i.is_mainstream, i.image_url, i.is_breaking, i.vip_quote, i.processed_by, i.sentiment, i.entities, i.created_at, s.name as sourceName
        FROM insights i
        LEFT JOIN sources s ON i.source_id = s.id
    '''
    
    params = []
    conditions = []
    
    if is_mainstream is not None:
        conditions.append('i.is_mainstream = ?')
        params.append(1 if is_mainstream else 0)
        
    if category and category.lower() != 'dashboard':
        conditions.append('i.category = ?')
        params.append(category.upper())
        
    if timeframe:
        if timeframe == 'day':
            conditions.append("i.created_at >= datetime('now', '-1 day')")
        elif timeframe == 'week':
            conditions.append("i.created_at >= datetime('now', '-7 days')")
        elif timeframe == 'month':
            conditions.append("i.created_at >= datetime('now', '-30 days')")
            
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
            
    query += ' ORDER BY i.created_at DESC LIMIT 500'
    cursor.execute(query, tuple(params))
        
    rows = cursor.fetchall()
    conn.close()
    
    insights = []
    for row in rows:
        insight = dict(row)
        # Convert the boolean flag to the frontend badge format
        insight['badge'] = 'Mainstream' if insight['is_mainstream'] else 'Under the Radar'
        try:
            insight['entities'] = json.loads(insight['entities']) if insight.get('entities') else []
        except:
            insight['entities'] = []
        insights.append(insight)
        
    return insights

@app.get("/api/stream")
async def stream_insights(request: Request):
    """
    Server-Sent Events (SSE) endpoint.
    Checks sqlite every 5 seconds for new rows and streams them to the UI.
    """
    async def event_generator():
        last_id = 0
        
        # Determine the current highest ID so we only stream truly *new* items
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT MAX(id) as max_id FROM insights')
        row = cur.fetchone()
        if row and row['max_id']:
            last_id = row['max_id']
        conn.close()

        while True:
            # If client disconnects, break out of loop
            if await request.is_disconnected():
                break
                
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT i.id, i.title, i.summary, i.url, i.category, i.signal_strength, i.is_mainstream, i.image_url, i.is_breaking, i.vip_quote, i.processed_by, i.sentiment, i.entities, i.created_at, s.name as sourceName
                FROM insights i
                LEFT JOIN sources s ON i.source_id = s.id
                WHERE i.id > ?
                ORDER BY i.id ASC
            ''', (last_id,))
            
            new_rows = cursor.fetchall()
            conn.close()
            
            for row in new_rows:
                # Format to JSON
                insight = dict(row)
                insight['badge'] = 'Mainstream' if insight['is_mainstream'] else 'Under the Radar'
                try:
                    insight['entities'] = json.loads(insight['entities']) if insight.get('entities') else []
                except:
                    insight['entities'] = []
                
                # Yield SSE format
                yield f"data: {json.dumps(insight)}\n\n"
                last_id = row['id']
                
            await asyncio.sleep(5) # Poll every 5 seconds
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/sources/health")
def get_source_health():
    """Returns the status of the Source Truth Ledger"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM sources')
    total = cursor.fetchone()['total']
    
    cursor.execute('SELECT category, COUNT(*) as count FROM sources GROUP BY category')
    breakdown = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "status": "online",
        "total_verified_sources": total,
        "category_breakdown": breakdown
    }

def search_duckduckgo_lite(query: str):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36)"}
    try:
        url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for a in soup.find_all('a', class_='result__snippet', limit=4):
            results.append(a.text)
        return " ".join(results)
    except Exception as e:
        return str(e)

@app.get("/api/research/{entity}")
def deep_dive_research(entity: str):
    """Live web-crawling Deep Dive Bot for real-time company synthesis."""
    context = search_duckduckgo_lite(f"{entity} tech news today why")
    
    prompt = f"You are a live intelligence analyst. A user just clicked on '{entity}' and asked 'What is happening with them right now?'. Here is the live search context: {context}. Synthesize a tense, factual, highly professional 2-3 sentence situation report. Do not use markdown."
    
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        client = Groq(api_key=groq_key)
        try:
            resp = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile"
            )
            report = resp.choices[0].message.content
        except Exception:
            report = f"Live feed interrupted for {entity}. Neural net offline."
    else:
        report = f"Live synthesis offline for {entity} (API Key Missing)."
        
    return {"entity": entity, "report": report}

@app.get("/api/market")
def get_market_data():
    """Live Market Data for top AI entities with % changes."""
    tickers = ["NVDA", "MSFT", "GOOG", "TSLA", "PLTR"]
    market_data = []
    
    for t in tickers:
        try:
            ticker = yf.Ticker(t)
            # Use 5d to ensure we capture at least 2 valid trading days
            hist = ticker.history(period="5d")
            if len(hist) >= 2:
                prev_close = hist['Close'].iloc[-2]
                current = hist['Close'].iloc[-1]
                change_pct = ((current - prev_close) / prev_close) * 100
                market_data.append({
                    "symbol": t,
                    "price": round(current, 2),
                    "change_pct": round(change_pct, 2)
                })
            else:
                market_data.append({"symbol": t, "price": 0, "change_pct": 0})
        except Exception as e:
            market_data.append({"symbol": t, "price": 0, "change_pct": 0})
            
    return market_data

@app.get("/api/market/{symbol}")
def get_historical_market_data(symbol: str):
    """Fetches 1-year historical market data for a specific ticker symbol globally."""
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period="1y")
        
        if hist.empty:
            return {"error": f"No data found for symbol {symbol}"}
            
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(row['Close'], 2)
            })
            
        info = ticker.info
        # Sometimes info is sparsely populated, fallback to last close price
        current_price = info.get('currentPrice')
        if not current_price and not hist.empty:
            current_price = hist['Close'].iloc[-1]
            
        market_cap = info.get('marketCap', 'N/A')
        
        return {
            "symbol": symbol.upper(),
            "name": info.get('longName', symbol.upper()),
            "current_price": round(current_price, 2) if current_price else 0,
            "market_cap": market_cap,
            "historical": data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/reader")
async def get_reader_content(url: str):
    """
    Extracts the full text content of an article for the Reader View.
    Uses local heuristics (BeautifulSoup) to minimize costs.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Heuristic: Remove scripts, styles, navs, footers, etc.
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'ads', 'noscript', 'svg']):
            tag.decompose()
            
        # Try to find the title
        title = ""
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text().strip()
        else:
            title = soup.title.string if soup.title else "Untitled Article"
            
        # Heuristic: Find the largest text container
        # Search for common article containers
        content_container = soup.find(['article', 'main']) or soup.find('div', class_=re.compile(r'article|post|content|entry-content|story-body', re.I)) or soup.find('div', id=re.compile(r'article|post|content', re.I))
        
        if not content_container:
            # Fallback: Find div with most <p> tags
            potential_containers = soup.find_all(['div', 'section'])
            best_container = None
            max_p = 0
            for container in potential_containers:
                p_count = len(container.find_all('p', recursive=False))
                if p_count > max_p:
                    max_p = p_count
                    best_container = container
            content_container = best_container
            
        if content_container:
            # Clean up the container text
            paragraphs = [p.get_text().strip() for p in content_container.find_all('p') if len(p.get_text().strip()) > 30]
            # Some sites don't use <p> tags for main content, check for chunks of text
            if not paragraphs:
                paragraphs = [text for text in content_container.stripped_strings if len(text) > 60]
            content = "\n\n".join(paragraphs[:30]) # Cap at 30 paragraphs
        else:
            # Ultimate fallback: all p tags in the body
            paragraphs = [p.get_text().strip() for p in soup.find_all('p') if len(p.get_text().strip()) > 30]
            content = "\n\n".join(paragraphs[:30])
            
        if not content or len(content) < 100:
            content = "Could not extract clean readable content. The page might be protected or requires JavaScript. Please visit the original source link below."
            
        return {
            "title": title,
            "content": content,
            "url": url
        }
        
    except Exception as e:
        return {"error": f"Failed to extract content: {str(e)}", "url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
