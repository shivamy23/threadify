from typing import List, Dict
import os
from huggingface_hub import InferenceClient

client = InferenceClient(api_key=os.getenv("HF_API_TOKEN"))

def summarize_discussion(comments: List[Dict]) -> str:
    """Uses AI to generate a cohesive summary of the discussion thread"""
    if not comments:
        return "No comments yet."
    
    if len(comments) < 5:
        return f"Discussion has {len(comments)} comment(s). Not enough for AI summary."

    # 1. Combine all comment text into one block
    full_thread = " ".join([c.get("content", "") for c in comments])
    
    # 2. Call a specialized summarization model (BART is excellent for this)
    try:
        # We use facebook/bart-large-cnn which is the industry standard for summaries
        summary_result = client.summarization(
            full_thread, 
            model="facebook/bart-large-cnn",
            parameters={"min_length": 30, "max_length": 150}
        )
        
        ai_summary = summary_result.summary_text
        return f"AI Discussion Summary ({len(comments)} comments):\n\n{ai_summary}"
        
    except Exception as e:
        # Fallback to your original logic if the API is down
        return f"Summary currently unavailable. Thread contains {len(comments)} active comments."