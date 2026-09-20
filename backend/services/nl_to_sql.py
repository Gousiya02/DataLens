import os
import re
import json
import httpx
import duckdb
import pandas as pd
from typing import Any, Dict


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def build_schema_description(df: pd.DataFrame) -> str:
    lines = ["Table name: data", "Columns:"]
    for col in df.columns:
        dtype = str(df[col].dtype)
        sample = df[col].dropna().head(3).tolist()
        lines.append(f'  - "{col}" ({dtype}), sample: {sample}')
    return "\n".join(lines)


def generate_fallback_sql(question: str, df: pd.DataFrame) -> (str, str):
    """Local rule-based NLP SQL fallback generator when LLM API is unavailable."""
    q = question.lower().strip()
    cols = df.columns.tolist()
    if not cols:
        return 'SELECT * FROM data LIMIT 10', 'Displayed sample data.'

    num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df[c])]
    cat_cols = [c for c in cols if c not in num_cols]

    # Match column names mentioned in question
    matched_num = [c for c in num_cols if c.lower() in q]
    matched_cat = [c for c in cat_cols if c.lower() in q]

    target_num = matched_num[0] if matched_num else (num_cols[0] if num_cols else None)
    target_cat = matched_cat[0] if matched_cat else (cat_cols[0] if cat_cols else None)

    if "how many" in q or "count" in q or "total rows" in q or "number of" in q:
        return 'SELECT COUNT(*) as total_records FROM data', 'Counted total records in dataset.'

    if ("average" in q or "avg" in q or "mean" in q) and target_num:
        if target_cat:
            return f'SELECT "{target_cat}", ROUND(AVG("{target_num}"), 2) as avg_{target_num} FROM data GROUP BY "{target_cat}" ORDER BY avg_{target_num} DESC LIMIT 10', f'Calculated average {target_num} grouped by {target_cat}.'
        return f'SELECT ROUND(AVG("{target_num}"), 2) as avg_{target_num} FROM data', f'Calculated average of {target_num}.'

    if ("total" in q or "sum" in q) and target_num:
        if target_cat:
            return f'SELECT "{target_cat}", ROUND(SUM("{target_num}"), 2) as total_{target_num} FROM data GROUP BY "{target_cat}" ORDER BY total_{target_num} DESC LIMIT 10', f'Calculated total {target_num} grouped by {target_cat}.'
        return f'SELECT ROUND(SUM("{target_num}"), 2) as total_{target_num} FROM data', f'Calculated total sum of {target_num}.'

    if ("top" in q or "highest" in q or "best" in q or "max" in q) and target_cat:
        if target_num:
            return f'SELECT "{target_cat}", ROUND(SUM("{target_num}"), 2) as total_{target_num} FROM data GROUP BY "{target_cat}" ORDER BY total_{target_num} DESC LIMIT 10', f'Retrieved top {target_cat} ranked by {target_num}.'
        return f'SELECT "{target_cat}", COUNT(*) as count FROM data GROUP BY "{target_cat}" ORDER BY count DESC LIMIT 10', f'Retrieved top {target_cat} by occurrence.'

    if ("lowest" in q or "worst" in q or "min" in q) and target_cat:
        if target_num:
            return f'SELECT "{target_cat}", ROUND(SUM("{target_num}"), 2) as total_{target_num} FROM data GROUP BY "{target_cat}" ORDER BY total_{target_num} ASC LIMIT 10', f'Retrieved lowest {target_cat} ranked by {target_num}.'

    # Aggregated query if category and numeric columns exist
    if target_cat and target_num:
        return f'SELECT "{target_cat}", ROUND(SUM("{target_num}"), 2) as total_{target_num} FROM data GROUP BY "{target_cat}" ORDER BY total_{target_num} DESC LIMIT 10', f'Aggregated {target_num} by {target_cat}.'

    if target_cat:
        return f'SELECT "{target_cat}", COUNT(*) as count FROM data GROUP BY "{target_cat}" ORDER BY count DESC LIMIT 10', f'Grouped records by {target_cat}.'

    return 'SELECT * FROM data LIMIT 10', 'Displayed preview of dataset.'


async def nl_to_sql(question: str, df: pd.DataFrame) -> Dict[str, Any]:
    sql = ""
    explanation = ""

    # 1. Try Groq AI model if key is configured
    if GROQ_API_KEY:
        try:
            schema = build_schema_description(df)
            prompt = f"""You are a SQL and Data Visualization expert. Given a table schema and a natural language question, generate a DuckDB SQL query and determine if a chart (bar, line, pie, area, scatter) or table is appropriate.

Schema:
{schema}

Rules:
- Table is always called "data"
- Return ONLY a JSON object with keys: "sql" (the query), "explanation" (one sentence), and optional "requested_chart" ("bar", "line", "pie", "area", "scatter", or "table")
- Use DuckDB syntax with double quotes around column names
- Limit results to 50 rows max
- No markdown, no backticks, just raw JSON

Question: {question}"""

            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 400,
            }

            async with httpx.AsyncClient(timeout=8) as client:
                resp = await client.post(GROQ_URL, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            raw = data["choices"][0]["message"]["content"].strip()
            raw = re.sub(r"```json|```", "", raw).strip()
            parsed = json.loads(raw)
            sql = parsed.get("sql", "")
            explanation = parsed.get("explanation", "")
            requested_chart = parsed.get("requested_chart", "")
        except Exception:
            sql, explanation = generate_fallback_sql(question, df)
            requested_chart = ""
    else:
        sql, explanation = generate_fallback_sql(question, df)
        requested_chart = ""

    if not sql:
        sql, explanation = generate_fallback_sql(question, df)

    # 2. Execute SQL on DuckDB safely
    try:
        con = duckdb.connect()
        con.register("data", df)
        result_df = con.execute(sql).df()
        con.close()
    except Exception:
        # Safe fallback if custom SQL execution fails
        sql, explanation = generate_fallback_sql(question, df)
        try:
            con = duckdb.connect()
            con.register("data", df)
            result_df = con.execute(sql).df()
            con.close()
        except Exception:
            con = duckdb.connect()
            con.register("data", df)
            result_df = con.execute("SELECT * FROM data LIMIT 10").df()
            con.close()
            sql = "SELECT * FROM data LIMIT 10"
            explanation = "Displayed preview of dataset."

    chart_type = "table"
    chart_data = []
    chart_title = ""
    cols = result_df.columns.tolist()
    q_lower = question.lower()
    is_chart_requested = any(w in q_lower for w in ["chart", "plot", "graph", "draw", "visualize", "bar", "line", "pie", "area", "scatter"])

    # Filter out auto-generated index / Unnamed columns when selecting x & y
    valid_cols = [c for c in cols if not str(c).lower().startswith("unnamed") and str(c).lower() != "index"]
    if not valid_cols:
        valid_cols = cols

    if len(valid_cols) >= 2 and len(result_df) > 0:
        c1, c2 = valid_cols[0], valid_cols[1]
        c2_is_num = pd.api.types.is_numeric_dtype(result_df[c2])
        c1_is_num = pd.api.types.is_numeric_dtype(result_df[c1])

        if c2_is_num or c1_is_num:
            x_col = c1 if c2_is_num else c2
            y_col = c2 if c2_is_num else c1
            
            for _, row in result_df.head(20).iterrows():
                val = row[y_col]
                x_val = str(row[x_col]) if row[x_col] is not None else ""
                try:
                    num_val = float(val) if (val is not None and not pd.isna(val)) else 0.0
                except (ValueError, TypeError):
                    num_val = 0.0

                chart_data.append({
                    "x": x_val,
                    "y": round(num_val, 2),
                    "name": x_val,
                    "value": round(num_val, 2)
                })

            if requested_chart in ["bar", "line", "pie", "area", "scatter"]:
                chart_type = requested_chart
            elif "line" in q_lower or "trend" in q_lower or "over time" in q_lower or any(k in str(x_col).lower() for k in ["date", "time", "month", "year", "day"]):
                chart_type = "line"
            elif "pie" in q_lower or "share" in q_lower or "percent" in q_lower or "distribution" in q_lower:
                chart_type = "pie"
            elif "area" in q_lower:
                chart_type = "area"
            elif "scatter" in q_lower or "correlation" in q_lower:
                chart_type = "scatter"
            elif "bar" in q_lower or "column" in q_lower or is_chart_requested or (len(chart_data) >= 2 and len(chart_data) <= 15):
                chart_type = "bar"

            def clean_name(c):
                s = re.sub(r"unnamed:\s*\d+", "", str(c), flags=re.IGNORECASE).strip()
                s = re.sub(r"[-_]", " ", s).strip()
                return s.title() if s else ""

            x_clean = clean_name(x_col)
            y_clean = clean_name(y_col)

            if x_clean and y_clean:
                chart_title = f"{y_clean} by {x_clean}"
            elif y_clean:
                chart_title = f"{y_clean} Distribution"
            elif x_clean:
                chart_title = f"Data by {x_clean}"
            else:
                chart_title = f"AI {chart_type.title()} Chart"

    return {
        "sql": sql,
        "explanation": explanation,
        "columns": cols,
        "rows": result_df.head(50).values.tolist(),
        "chart_type": chart_type,
        "chart_title": chart_title,
        "chart_data": chart_data,
    }
