import requests
import json

def test_reader():
    url = "https://techcrunch.com/2024/03/10/apple-vision-pro-sales-projections/"
    print(f"Testing Reader View for: {url}")
    
    try:
        # Test Local Extraction
        res = requests.get(f"http://localhost:8000/api/reader?url={url}")
        data = res.json()
        print("\n--- Reader Extraction Result ---")
        print(f"Title: {data.get('title')}")
        content = data.get('content', '')
        print(f"Content Length: {len(content)}")
        print(f"Content Preview: {content[:200]}...")
        
        # Test Sentiment (via a mock gathered item to processor)
        from processor import get_strong_sentiment
        sentiment, reasoning = get_strong_sentiment("Apple Vision Pro sales might exceed expectations", "Analyst reports suggest high demand in enterprise sectors.")
        print("\n--- Strong AI Sentiment Result ---")
        print(f"Sentiment: {sentiment}")
        print(f"Reasoning: {reasoning}")
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_reader()
