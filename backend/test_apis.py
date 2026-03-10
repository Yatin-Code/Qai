import os
import requests
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI
import cohere

load_dotenv()

PROMPT = "Hi, which model are you? Please give a very short 1 sentence answer."

def print_result(name, is_success, response):
    status = "✅ SUCCESS" if is_success else "❌ FAILED"
    print(f"\n--- {name} ---")
    print(f"Status: {status}")
    print(f"Response: {response}")

def test_groq():
    try:
        client = OpenAI(api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
        response = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=[{"role": "user", "content": PROMPT}])
        print_result("Groq (Llama 3.3 70B)", True, response.choices[0].message.content)
    except Exception as e:
        print_result("Groq", False, str(e))

def test_openrouter():
    try:
        client = OpenAI(api_key=os.getenv("OPENROUTER_API_KEY"), base_url="https://openrouter.ai/api/v1")
        response = client.chat.completions.create(model="openrouter/auto", messages=[{"role": "user", "content": PROMPT}])
        print_result("OpenRouter (Auto)", True, response.choices[0].message.content)
    except Exception as e:
        print_result("OpenRouter", False, str(e))

def test_gemini():
    try:
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(PROMPT)
        print_result("Google Gemini", True, response.text)
    except Exception as e:
        print_result("Google Gemini", False, str(e))

def test_together():
    try:
        client = OpenAI(api_key=os.getenv("TOGETHER_API_KEY"), base_url="https://api.together.xyz/v1")
        response = client.chat.completions.create(model="meta-llama/Llama-2-7b-chat-hf", messages=[{"role": "user", "content": PROMPT}])
        print_result("Together.ai (Llama 2)", True, response.choices[0].message.content)
    except Exception as e:
        print_result("Together.ai", False, str(e))

def test_cohere():
    try:
        co = cohere.Client(os.getenv("COHERE_API_KEY"))
        response = co.chat(message=PROMPT, model="command-r-plus")
        print_result("Cohere (Command R+)", True, response.text)
    except Exception as e:
        print_result("Cohere", False, str(e))

def test_huggingface():
    try:
        headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}
        # Using a reliable HF inference endpoint
        API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        response = requests.post(API_URL, headers=headers, json={"inputs": PROMPT})
        response.raise_for_status()
        print_result("Hugging Face (Mistral 7B)", True, response.json()[0]['generated_text'])
    except Exception as e:
        print_result("Hugging Face", False, str(e))

def test_cerebras():
    try:
        client = OpenAI(api_key=os.getenv("CEREBRAS_API_KEY"), base_url="https://api.cerebras.ai/v1")
        response = client.chat.completions.create(model="llama3.1-8b", messages=[{"role": "user", "content": PROMPT}])
        print_result("Cerebras (Llama 3.1 8B)", True, response.choices[0].message.content)
    except Exception as e:
        print_result("Cerebras", False, str(e))

def test_replicate():
    try:
        headers = {"Authorization": f"Token {os.getenv('REPLICATE_API_TOKEN')}"}
        response = requests.get("https://api.replicate.com/v1/models/meta/llama-2-7b", headers=headers)
        if response.status_code == 200:
            print_result("Replicate", True, "Successfully authenticated with Replicate API via Token.")
        else:
            print_result("Replicate", False, f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_result("Replicate", False, str(e))

def test_cloudflare():
    print_result("Cloudflare Workers AI", False, "Missing Account ID. API Key alone is not enough for Workers AI. It requires: https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/...")

if __name__ == "__main__":
    print("🚀 Initiating Swarm API Sweep...\n")
    test_groq()
    test_openrouter()
    test_gemini()
    test_together()
    test_cohere()
    test_huggingface()
    test_cerebras()
    test_replicate()
    test_cloudflare()
    print("\n🏁 Swarm Sweep Complete.")
