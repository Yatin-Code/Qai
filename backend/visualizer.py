import os
import requests
import random
from dotenv import load_dotenv

load_dotenv()

# TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

# Curated high-quality Unsplash fallbacks based on categories/keywords
# Using specific IDs for high-quality, professional photography
CATEGORY_IMAGES = {
    "AI_CHIPS": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd728?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=1200"
    ],
    "NEURAL_NETWORKS": [
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1625316708582-7c3873423ade?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200"
    ],
    "CYBER": [
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1510511459019-5dee2c1a7eaa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200"
    ],
    "OPEN_SOURCE": [
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1522071823991-b997ee711592?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200"
    ],
    "ROBOTICS": [
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1527430253228-e92d4f6db48a?auto=format&fit=crop&q=80&w=1200"
    ],
    "FINANCE": [
        "https://images.unsplash.com/photo-1611974714025-46205e31c63f?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1611974714025-46205e31c63f?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1535320485706-44d43b91d500?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200"
    ],
    "LEGAL": [
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1447023029226-ef8f5b82b8cf?auto=format&fit=crop&q=80&w=1200"
    ],
    "SPACE": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1614728263952-84ea206f99b6?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200"
    ],
    "HUGGINGFACE": [
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=1200"
    ],
    "GENERAL_TECH": [
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200"
    ]
}

KEYWORD_MAP = {
    "gpu": "AI_CHIPS", "h100": "AI_CHIPS", "nvidia": "AI_CHIPS", "chip": "AI_CHIPS", "semiconductor": "AI_CHIPS",
    "llm": "NEURAL_NETWORKS", "gpt": "NEURAL_NETWORKS", "transformer": "NEURAL_NETWORKS", "model": "NEURAL_NETWORKS", "training": "NEURAL_NETWORKS",
    "robot": "ROBOTICS", "automation": "ROBOTICS", "humanoid": "ROBOTICS", "drone": "ROBOTICS",
    "stock": "FINANCE", "market": "FINANCE", "trading": "FINANCE", "nasdaq": "FINANCE", "sec": "FINANCE", "revenue": "FINANCE",
    "lawsuit": "LEGAL", "court": "LEGAL", "regulation": "LEGAL", "eu ai act": "LEGAL", "justice": "LEGAL",
    "spacex": "SPACE", "nasa": "SPACE", "rocket": "SPACE", "orbit": "SPACE", "satellite": "SPACE",
    "security": "CYBER", "breach": "CYBER", "hacker": "CYBER", "cyber": "CYBER", "privacy": "CYBER",
    "github": "OPEN_SOURCE", "open source": "OPEN_SOURCE", "oss": "OPEN_SOURCE", "dataset": "OPEN_SOURCE",
    "huggingface": "HUGGINGFACE", "hf": "HUGGINGFACE"
}

def generate_together_image(prompt):
    """Generates a high-quality AI image using Together AI's Flux model."""
    api_key = os.getenv("TOGETHER_API_KEY")
    if not api_key:
        return None
        
    try:
        url = "https://api.together.xyz/v1/images/generations"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "black-forest-labs/FLUX.1-schnell",
            "prompt": f"Professional editorial news photography about: {prompt}. Cinematic lighting, 8k, detailed.",
            "width": 1024,
            "height": 768,
            "steps": 4,
            "n": 1
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 402:
            print("💰 Together AI Credits Exhausted.")
            return None
            
        response.raise_for_status()
        result = response.json()
        if 'data' in result and len(result['data']) > 0:
            return result['data'][0]['url']
            
    except Exception as e:
        print(f"❌ Together AI Error: {e}")
    return None

def generate_replicate_image(prompt):
    """Generates a high-quality AI image using Replicate's Flux model."""
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        return None
        
    try:
        url = "https://api.replicate.com/v1/predictions"
        headers = {
            "Authorization": f"Token {api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "version": "6359a68a1835560c0422d3e970b5a1534b12543922d95b54203ae8d2c0b8ac51",
            "input": {
                "prompt": f"Professional editorial news visual for: {prompt}. High resolution, 8k, minimalist."
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 402:
            print("💰 Replicate Credits Exhausted.")
            return None
        response.raise_for_status()
        
        prediction = response.json()
        pred_id = prediction['id']
        
        import time
        for _ in range(15):
            res = requests.get(f"https://api.replicate.com/v1/predictions/{pred_id}", headers=headers)
            res_data = res.json()
            if res_data['status'] == 'succeeded':
                return res_data['output'][0] if isinstance(res_data['output'], list) else res_data['output']
            if res_data['status'] in ['failed', 'canceled']:
                return None
            time.sleep(0.7)
            
    except Exception as e:
        print(f"❌ Replicate Error: {e}")
    return None

def generate_ai_image(prompt):
    """Rotates between available AI providers to distribute credit load."""
    providers = [generate_together_image, generate_replicate_image]
    random.shuffle(providers)
    
    for provider in providers:
        img = provider(prompt)
        if img:
            return img
    return None

def get_contextual_image(title, summary, category, signal_strength):
    """Decides whether to generate an AI image (with probability) or pick a high-quality fallback."""
    text = (title + " " + (summary or "")).lower()
    
    # AI Generation Probability Gate (Only 5% of Hero stories get AI, to save credits)
    if signal_strength >= 90:
        if random.random() < 0.05:
            print(f"✨ Lucky Win: Attempting AI Hero Visual for: {title[:30]}...")
            ai_img = generate_ai_image(title)
            if ai_img:
                return ai_img
        else:
            print(f"♻️ Credit Savings: Using premium fallback for Hero item: {title[:30]}")

    # Keyword matching for smart fallback
    chosen_cat = "GENERAL_TECH"
    for kw, cat in KEYWORD_MAP.items():
        if kw in text:
            chosen_cat = cat
            break
            
    # Fallback to general category mapping if no keyword hit
    if chosen_cat == "GENERAL_TECH":
        if category == "FINANCE": chosen_cat = "FINANCE"
        elif category == "RESEARCH": chosen_cat = "NEURAL_NETWORKS"
        elif category == "LEGAL": chosen_cat = "LEGAL"
        elif "huggingface" in (category or "").lower(): chosen_cat = "HUGGINGFACE"

    return random.choice(CATEGORY_IMAGES[chosen_cat])

if __name__ == "__main__":
    # Test logic
    print(get_contextual_image("New NVIDIA H100 Chips released", "Performance doubled in latest benchmarks", "RESEARCH", 95))
    print(get_contextual_image("SEC files lawsuit against tech giant", "Legal battle intensifies over data privacy", "LEGAL", 50))
