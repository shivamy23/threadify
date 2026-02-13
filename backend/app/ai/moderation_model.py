import requests
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

API_URL = "https://router.huggingface.co/hf-inference/models/unitary/toxic-bert"

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/json"
}


def analyze_text(text: str):
    payload = {
        "inputs": text
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        print("HF ERROR:", response.text)
        return {"label": "neutral", "score": 0}

    result = response.json()

    # Router returns nested list:
    # [[{label:..., score:...}, {...}]]

    if isinstance(result, list):
        result = result[0]  # first list

    if isinstance(result, list):
        # Get highest score prediction
        best = max(result, key=lambda x: x["score"])
        return {
            "label": best["label"].lower(),
            "score": best["score"]
        }

    # fallback safety
    return {"label": "neutral", "score": 0}

