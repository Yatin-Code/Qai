from sentence_transformers import SentenceTransformer, util
import time

print("Loading local embedding model: all-MiniLM-L6-v2...")
start_time = time.time()

# This line will automatically download the ~80MB model from HuggingFace to your local cache
# if it hasn't been downloaded already. On subsequent runs, it loads instantly from cache.
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print(f"✅ Model loaded successfully in {time.time() - start_time:.2f} seconds!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    exit(1)

print("\n--- Running Semantic Verification Test ---")

# Let's say we scraped this fact from a secret Github repo
our_secret_fact = "Apple is quietly releasing a new AI model called MGIE that edits images."

# And let's pretend these are the headlines currently in our Mainstream Ledger
mainstream_headlines = [
    "Stock market hits all time high today",
    "How to bake the perfect chocolate chip cookie",
    "Apple announces new open source AI image editor MGIE at conference", # This one is semantically identical!
    "Tim Cook visits new Apple store in London"
]

print(f"Our Insight: '{our_secret_fact}'")
print("\nComparing against Mainstream Headlines:")

# Convert our fact to a math vector
insight_vector = model.encode(our_secret_fact)

is_mainstream = False
for headline in mainstream_headlines:
    # Convert mainstream headline to math vector
    mainstream_vector = model.encode(headline)
    
    # Calculate similarity (0 to 1)
    similarity = util.cos_sim(insight_vector, mainstream_vector).item()
    
    match_status = "🚨 UNDER THE RADAR"
    if similarity > 0.80:
         match_status = "🎯 MATCHER (MAINSTREAM)"
         is_mainstream = True
         
    print(f"  Similarity {similarity:.2f}: {headline[:40]}... -> {match_status}")

print(f"\nFinal Verdict: {'MAINSTREAM' if is_mainstream else 'UNDER THE RADAR'}")
