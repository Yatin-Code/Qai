from visualizer import get_contextual_image

print("Test 1: High Signal (should try AI then fallback)")
img1 = get_contextual_image("OpenAI acquires Promptfoo", "Huge deal in AI safety", "RESEARCH", 95)
print(f"Result 1: {img1}")

print("\nTest 2: Normal Signal (Keyword matching)")
img2 = get_contextual_image("Nvidia H100 benchmarks", "GPU performance is great", "RESEARCH", 50)
print(f"Result 2: {img2}")

print("\nTest 3: Empty keywords")
img3 = get_contextual_image("Something random", "No keywords here", "OTHER", 10)
print(f"Result 3: {img3}")
