from typing import List, Dict

def summarize_discussion(comments: List[Dict]) -> str:
    """Generate summary from comments (simple extractive approach)"""
    if not comments:
        return "No comments yet."
    
    if len(comments) < 5:
        return f"Discussion has {len(comments)} comment(s). Not enough for summary."
    
    # Extract key points (simple heuristic: longest comments)
    sorted_comments = sorted(comments, key=lambda x: len(x.get("content", "")), reverse=True)
    top_comments = sorted_comments[:3]
    
    summary_parts = []
    for i, comment in enumerate(top_comments, 1):
        content = comment.get("content", "")
        preview = content[:100] + "..." if len(content) > 100 else content
        summary_parts.append(f"{i}. {preview}")
    
    summary = f"Discussion Summary ({len(comments)} comments):\\n\\n" + "\\n\\n".join(summary_parts)
    return summary
