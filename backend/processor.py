from bs4 import BeautifulSoup
from groq import Groq
from database import get_db_connection
import json
import random
import re
import os

def get_strong_sentiment(title, text):
    """
    Uses Groq (Llama-3-8b-instant) for high-quality, 'strong' sentiment analysis.
    Cost-efficient and fast.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Neutral", "Manual filter: API key missing."
        
    client = Groq(api_key=api_key)
    prompt = f"""
    Analyze the market sentiment of this news headline and snippet.
    Headline: {title}
    Snippet: {text[:300]}
    
    Respond in EXACTLY this JSON format:
    {{
        "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
        "reasoning": "One short sentence explaining why."
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=100
        )
        res = json.loads(completion.choices[0].message.content)
        return res.get("sentiment", "Neutral").capitalize(), res.get("reasoning", "")
    except Exception as e:
        print(f"❌ Groq Sentiment Error: {e}")
        return "Neutral", f"Error: {str(e)}"

def extract_summary(text):
    """Fallback simple summary: split by sentences and take first 2-3."""
    if not text:
        return ""
    # simple sentence splitting proxy
    sentences = re.split(r'(?<=[.!?]) +', text.replace('\n', ' '))
    return ' '.join(sentences[:3])

def extract_quote(text):
    """Extracts the first quote from text if it exists."""
    matches = re.findall(r'"([^"]*)"', text)
    if matches and len(matches[0]) > 20: 
        return matches[0]
    return None

def calculate_personal_relevance(title, text_to_analyze):
    """
    Boosts items matching the user's explicit interests: 
    AI Agents, AGI, LLMs, and big tech model releases.
    """
    score_boost = 0
    title_lower = title.lower()
    
    # Tier 1: Core Technologies (Massive Boost)
    core_tech = ['agi', 'agent', 'agents', 'llm', 'llms', 'large language model']
    if any(kw in title_lower for kw in core_tech):
         score_boost += 60
         
    # Tier 2: Specific Models & Breakthroughs
    models = ['claude', 'gpt', 'gemini', 'llama', 'mistral', 'new model', 'model release', 'weights']
    if any(kw in title_lower for kw in models):
         score_boost += 50
         
    # Tier 3: Key Players (Contextual Boost)
    players = ['anthropic', 'openai', 'google', 'apple', 'microsoft', 'meta']
    release_verbs = ['announces', 'releases', 'launches', 'unveils', 'updates']
    
    has_player = any(player in title_lower for player in players)
    has_release = any(verb in title_lower for verb in release_verbs)
    if has_player and has_release:
         score_boost += 40
         
    return score_boost

def process_item_heuristics(item):
    """
    Deterministic extractor for basic Pipeline plumbing. NO LLMS needed!
    """
    title = item.get('title', '')
    raw_text = item.get('raw_text', '')
    category = item.get('category', 'TECH')
    
    text_to_analyze = (title + " " + raw_text).lower()
    
    # 1. Breaking News Heuristic
    breaking_keywords = ['breaking', 'launches', 'announces', 'acquired', 'raises', 'funding', 'unveils', 'resigns', 'soars', 'plummets']
    is_breaking = any(kw in title.lower() for kw in breaking_keywords)
    
    # 2. Signal Strength Heuristic (0 to 100)
    signal_strength = 20 # Lowered base score to make personalized items stand out more
    if is_breaking:
        signal_strength += 20
    
    signal_keywords = ['revolutionary', 'paradigm', 'trillion', 'billion', 'exclusive', 'major', 'critical']
    for kw in signal_keywords:
        if kw in text_to_analyze:
            signal_strength += 10
            
    # Add Personal Relevance Engine Boost
    personal_boost = calculate_personal_relevance(title, text_to_analyze)
    signal_strength += personal_boost
            
    signal_strength = min(100, signal_strength)
    
    # 3. Categorization inherited directly from the Ledger Source
    # 4. Extract VIP Quote if applicable
    vip_quote = None
    if category == 'VIP':
        vip_quote = extract_quote(raw_text)
    
    # 5. Is it Noise?
    # Loosened filters to catch short, punchy technical discoveries (e.g. GitHub releases)
    is_signal = len(raw_text.strip()) > 15 or len(title.strip()) > 10
    
    summary = extract_summary(raw_text)
    if not summary:
        summary = title

    # 6. Strong AI Sentiment
    sentiment, reasoning = get_strong_sentiment(title, raw_text)
        
    # Extract basic known entities
    known_entities = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'BTC', 'ETH']
    found_entities = [e for e in known_entities if e in title or e in raw_text]

    return {
        "is_signal": is_signal,
        "title": title,
        "summary": summary,
        "signal_strength": signal_strength,
        "category": category,
        "is_breaking": is_breaking,
        "vip_quote": vip_quote,
        "sentiment": sentiment,
        "sentiment_reasoning": reasoning,
        "entities": json.dumps(list(set(found_entities)))
    }, "Strong AI (Groq)"


import string

def tokenize(text):
    if not text:
        return set()
    text = text.lower()
    for c in string.punctuation:
        text = text.replace(c, '')
    words = set(text.split())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as'}
    return words - stop_words

def calculate_mainstream_radar(insight_title_tokens, item_url, pre_tokenized_mainstream):
    """
    Checks if an insight is already in the Mainstream Ledger or is from a Mainstream Source.
    Returns True if Mainstream, False if Under the Radar.
    """
    # 1. Domain Check
    mainstream_domains = ['nytimes.com', 'bloomberg.com', 'wsj.com', 'reuters.com', 'cnbc.com', 'techcrunch.com', 'theverge.com', 'wired.com']
    for domain in mainstream_domains:
        if domain in item_url.lower():
            return True

    # 2. Semantic Radar Check
    if not pre_tokenized_mainstream:
        return False # No mainstream data yet

    if not insight_title_tokens:
        return False

    for mainstream_tokens in pre_tokenized_mainstream:
        intersection = insight_title_tokens.intersection(mainstream_tokens)
        overlap_ratio = len(intersection) / len(insight_title_tokens) if len(insight_title_tokens) > 0 else 0
        
        if len(intersection) >= 4 or overlap_ratio > 0.40:
            return True # It is Mainstream
            
    return False # It is Under the Radar

def run_processor_pipeline(gathered_items):
    """Takes gathered items, routes them through rule-based heuristics, checks radar, and saves to DB."""
    import sys
    print(f"DEBUG: Processing {len(gathered_items)} items...")
    sys.stdout.flush()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    pre_tokenized_mainstream = []
    try:
        mainstream_headlines = conn.execute('SELECT headline FROM mainstream_ledger').fetchall()
        print(f"DEBUG: Pre-tokenizing {len(mainstream_headlines)} mainstream headlines...")
        sys.stdout.flush()
        for row in mainstream_headlines:
            headline = row['headline'] if isinstance(row, sqlite3.Row) else row[0]
            tokens = tokenize(headline)
            if tokens:
                pre_tokenized_mainstream.append(tokens)
    except Exception as e:
        print(f"DEBUG: Error processing mainstream_ledger: {e}")
        pre_tokenized_mainstream = []
    
    print(f"DEBUG: Pre-tokenization complete.")
    sys.stdout.flush()

    for item in gathered_items:
        # Determine Title
        title = item.get('title', 'NO TITLE')
        
        # 1. Ask Extractor to deterministically evaluate and extract
        try:
            insight, processed_by = process_item_heuristics(item)
        except Exception as e:
            print(f"DEBUG: Heuristic Error: {e}")
            continue
        
        if not insight or not insight.get('is_signal'):
            continue
            
        # 2. Strong Semantic Radar Check
        insight_tokens = tokenize(insight['title'])
        is_mainstream = calculate_mainstream_radar(insight_tokens, item['url'], pre_tokenized_mainstream)

        # 3. Image Fallback & Intelligence
        image_url = item.get('image_url', '')
        is_hero = insight['signal_strength'] >= 90
        
        # We override if: missing, generic (.svg/hf), or if it's a high-signal Hero story
        if not image_url or image_url.endswith('.svg') or 'huggingface' in image_url or is_hero:
            from visualizer import get_contextual_image
            image_url = get_contextual_image(
                insight['title'], 
                insight['summary'], 
                insight['category'], 
                insight['signal_strength']
            )
            
        # 4. Save to DB
        try:
            cursor.execute('''
                INSERT INTO insights (source_id, title, summary, url, category, signal_strength, is_mainstream, image_url, is_breaking, vip_quote, processed_by, sentiment, sentiment_reasoning, full_content, entities)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item.get('source_id', 0), 
                insight['title'], 
                insight['summary'], 
                item['url'], 
                insight['category'], 
                insight['signal_strength'], 
                1 if is_mainstream else 0,
                image_url,
                1 if insight.get('is_breaking') else 0,
                insight.get('vip_quote', ''),
                processed_by,
                insight.get('sentiment', 'Neutral'),
                insight.get('sentiment_reasoning', ''),
                item.get('raw_text', ''),
                insight.get('entities', '[]')
            ))
            conn.commit()
        except sqlite3.IntegrityError:
            pass # Skip existing URLs
        except Exception as e:
            print(f"DEBUG: DB Insert Error: {e}")
            sys.stdout.flush()

    conn.close()
    print("🎉 Processing Pipeline Complete.")
    sys.stdout.flush()

if __name__ == "__main__":
    pass
