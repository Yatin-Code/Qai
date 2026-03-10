import time
import schedule
import sys
from datetime import datetime
from mainstream_gatherer import gather_mainstream_headlines
from gatherer import sync_ledger_to_db, gather_data
from huggingface_gatherer import gather_huggingface_models
from github_gatherer import gather_github_repos
from hackernews_gatherer import gather_hn_ai_news

def run_pipeline():
    print(f"\n{'='*60}\n[{datetime.now()}] 🚀 STARTING QAI AUTOMATED PIPELINE LOOP\n{'='*60}")
    
    try:
        # 1. Update the Mainstream Radar Ledger so we have fresh comparison data
        gather_mainstream_headlines()
        
        # 2. Sync any new URLs you might have added to ledger.csv
        sync_ledger_to_db()
        
        # 3. Gather primary sources and hand them off to processor.py (AI Swarm)
        gather_data()
        
        # 4. Gather high-velocity leading indicators
        gather_huggingface_models()
        gather_github_repos()
        gather_hn_ai_news()
        
    except Exception as e:
        print(f"❌ Unhandled exception in pipeline: {e}")
        
    print(f"\n[{datetime.now()}] 🛑 PIPELINE LOOP COMPLETE. Sleeping for 4 hours...\n")

def main():
    print("🤖 Qai Master Loop Initialized.")
    print("Running the very first pipeline scrape...")
    run_pipeline()
    
    # Schedule to run every 4 hours automatically
    schedule.every(4).hours.do(run_pipeline)
    
    print("⏳ Scheduler active. Qai is running in the background...")
    try:
        while True:
            schedule.run_pending()
            time.sleep(60) # Wake up and check every 60 seconds
    except KeyboardInterrupt:
        print("\n🛑 Gracefully shutting down Qai Master Loop.")
        sys.exit(0)

if __name__ == "__main__":
    main()
