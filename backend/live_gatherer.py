import time
import sys
import os
from gatherer import gather_data, sync_ledger_to_db

def run_live_loop():
    print("🚀 QAI Live Gatherer Daemon Started")
    print("-----------------------------------")
    
    # Initial sync
    try:
        sync_ledger_to_db()
    except Exception as e:
        print(f"⚠️ Initial sync failed: {e}")

    sweep_count = 0
    while True:
        sweep_count += 1
        print(f"\n📡 Starting Sweep #{sweep_count} at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            gather_data()
            print(f"✅ Sweep #{sweep_count} completed successfully.")
        except Exception as e:
            print(f"❌ Sweep #{sweep_count} failed: {e}")
            print("Retrying in the next cycle...")
        
        # Prevent IP bans and credit burn: Sleep for 60 seconds
        print("😴 Sleeping for 60 seconds...")
        time.sleep(60)

if __name__ == "__main__":
    try:
        run_live_loop()
    except KeyboardInterrupt:
        print("\n🛑 Live Gatherer Daemon stopped by user.")
        sys.exit(0)
