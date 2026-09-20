import pandas as pd
import numpy as np
from typing import List, Dict, Any


def generate_simple_explanation_and_fix(col: str, val: float, mean: float, direction: str, pct_diff: float, context: str) -> (str, str):
    """Generate concise 2-line anomaly descriptions (Line 1: Anomaly description, Line 2: Fix action)."""
    val_str = f"{val:,.2f}" if isinstance(val, (int, float)) else str(val)
    mean_str = f"{mean:,.2f}" if isinstance(mean, (int, float)) else str(mean)

    if direction == "high":
        what = f"Anomaly: '{col}' value ({val_str}) at {context} is unusually high (average is {mean_str})."
        fix = f"Fix: Check for typos or extra zeros, then correct the value or delete the invalid row."
    elif direction == "low":
        what = f"Anomaly: '{col}' value ({val_str}) at {context} is unusually low (average is {mean_str})."
        fix = f"Fix: Check for missing data or misplaced decimals, then update or remove the entry."
    elif direction == "spike":
        what = f"Anomaly: '{col}' had an unusual spike during {context}."
        fix = f"Fix: Verify if data was double-entered for {context} and remove duplicate rows."
    else: # drop
        what = f"Anomaly: '{col}' had an unusual drop during {context}."
        fix = f"Fix: Check if data collection stopped or rows were missed, then add the missing records."

    return what, fix


def detect_anomalies(df: pd.DataFrame, profile: dict) -> List[Dict[str, Any]]:
    anomalies = []
    numeric_cols = profile.get("numeric_cols", [])
    date_cols = profile.get("date_cols", [])

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 5:
            continue

        # Z-score & IQR outlier detection
        mean = series.mean()
        std = series.std()
        if std == 0:
            continue
        z_scores = ((series - mean) / std).abs()
        outlier_mask = z_scores > 2.5
        outlier_indices = series[outlier_mask].index.tolist()

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        iqr_mask = (series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)
        iqr_indices = series[iqr_mask].index.tolist()

        combined = list(set(outlier_indices) | set(iqr_indices))[:25]

        for idx in combined:
            val = df.loc[idx, col]
            direction = "high" if val > mean else "low"
            pct_diff = abs((val - mean) / mean * 100) if mean != 0 else 0

            context = f"Row {idx+1}"
            if date_cols:
                try:
                    date_val = pd.to_datetime(df.loc[idx, date_cols[0]], errors="coerce")
                    context = str(date_val.date()) if pd.notna(date_val) else f"Row {idx+1}"
                except Exception:
                    pass
            elif profile.get("category_cols"):
                cat_col = profile["category_cols"][0]
                context = str(df.loc[idx, cat_col])

            what_is_it, how_to_fix = generate_simple_explanation_and_fix(col, float(val), float(mean), direction, float(pct_diff), context)

            anomalies.append({
                "column": col,
                "value": round(float(val), 2),
                "mean": round(float(mean), 2),
                "pct_diff": round(float(pct_diff), 1),
                "direction": direction,
                "context": context,
                "severity": "high" if pct_diff > 100 else "medium",
                "message": f"{col} is {pct_diff:.0f}% {'above' if direction == 'high' else 'below'} normal average at {context}",
                "what_is_it": what_is_it,
                "how_to_fix": how_to_fix,
            })

    # Time series anomaly: sudden drops/spikes
    if date_cols and numeric_cols:
        try:
            date_col = date_cols[0]
            num_col = numeric_cols[0]
            temp = df.copy()
            temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
            temp = temp.dropna(subset=[date_col]).sort_values(date_col)
            grouped = temp.groupby(temp[date_col].dt.to_period("M"))[num_col].sum()
            pct_change = grouped.pct_change().abs()
            spike_months = pct_change[pct_change > 0.4]
            for period, change in spike_months.items():
                direction = "drop" if grouped.get(period, 0) < grouped.shift(1).get(period, 0) else "spike"
                context = str(period)
                val = float(grouped[period])
                mean_val = float(grouped.mean())
                pct_diff = float(change * 100)

                what_is_it, how_to_fix = generate_simple_explanation_and_fix(num_col, val, mean_val, direction, pct_diff, context)

                anomalies.append({
                    "column": num_col,
                    "value": round(val, 2),
                    "mean": round(mean_val, 2),
                    "pct_diff": round(pct_diff, 1),
                    "direction": direction,
                    "context": context,
                    "severity": "high" if change > 0.6 else "medium",
                    "message": f"{num_col} had a {pct_diff:.0f}% {direction} in {context}",
                    "what_is_it": what_is_it,
                    "how_to_fix": how_to_fix,
                })
        except Exception:
            pass

    # Sort anomalies by highest pct_diff first
    anomalies.sort(key=lambda x: x.get("pct_diff", 0), reverse=True)
    return anomalies

