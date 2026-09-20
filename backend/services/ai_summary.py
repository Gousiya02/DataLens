import os
import httpx
from typing import Dict, Any


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


async def generate_summary(profile: dict, anomalies: list) -> str:
    numeric_summary = []
    for col in profile.get("columns", []):
        if col["type"] == "numeric":
            numeric_summary.append(
                f"{col['name']}: total={col.get('sum', 'N/A')}, avg={col.get('mean', 'N/A')}, min={col.get('min', 'N/A')}, max={col.get('max', 'N/A')}"
            )

    category_summary = []
    for col in profile.get("columns", []):
        if col["type"] == "category":
            top = col.get("top_values", {})
            top_str = ", ".join([f"{k}({v})" for k, v in list(top.items())[:3]])
            category_summary.append(f"{col['name']}: top values — {top_str}")

    anomaly_strs = [a["message"] for a in anomalies[:3]]

    prompt = f"""You are a data analyst. Given this dataset summary, write a concise 3-sentence insight paragraph for a business user.

Dataset: {profile.get('row_count', 0)} rows, {profile.get('col_count', 0)} columns

Numeric columns:
{chr(10).join(numeric_summary) or 'None'}

Category columns:
{chr(10).join(category_summary) or 'None'}

Anomalies detected:
{chr(10).join(anomaly_strs) or 'None'}

Write 3 sentences only. Be specific with numbers. No bullet points. Plain English."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 200, "temperature": 0.4},
    }

    if not GEMINI_API_KEY:
        rows = profile.get("row_count", 0)
        cols = profile.get("col_count", 0)
        num_cols = len(profile.get("numeric_cols", []))
        cat_cols = len(profile.get("category_cols", []))
        return f"This dataset contains {rows:,} rows across {cols} columns, featuring {num_cols} numerical metrics and {cat_cols} categorical fields. " \
               f"DataLens profiled all features and generated interactive charts and KPI metrics. " \
               f"You can explore distribution patterns, anomalies, and query specific data points directly below."

    try:
        url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        rows = profile.get("row_count", 0)
        cols = profile.get("col_count", 0)
        num_cols = len(profile.get("numeric_cols", []))
        return f"Dataset contains {rows:,} records across {cols} columns with {num_cols} numerical features. Key statistics and automated visual charts have been computed for analysis."
