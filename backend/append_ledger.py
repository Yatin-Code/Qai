import os

LEDGER_PATH = os.path.join(os.path.dirname(__file__), 'ledger.csv')

new_sources = [
    "r/LocalLLaMA,https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day,TECH",
    "r/MachineLearning,https://www.reddit.com/r/MachineLearning/top/.rss?t=day,RESEARCH",
    "HuggingFace Daily Papers,https://huggingface.co/papers.rss,RESEARCH",
    "Ollama Blog,https://ollama.com/blog.rss,TECH",
    "Together AI Blog,https://www.together.ai/blog/rss.xml,TECH"
]

with open(LEDGER_PATH, 'a', encoding='utf-8') as f:
    for source in new_sources:
        f.write(source + "\n")
print("Ledger expanded successfully.")
