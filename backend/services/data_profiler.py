import pandas as pd
import numpy as np
from typing import Dict, Any


def infer_column_type(series: pd.Series) -> str:
    try:
        if pd.api.types.is_datetime64_any_dtype(series):
            return "date"
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"
        
        sample = series.dropna().head(20)
        if len(sample) > 0:
            try:
                parsed = pd.to_datetime(sample, errors="coerce")
                if parsed.notna().sum() / len(sample) > 0.7:
                    return "date"
            except Exception:
                pass

        nunique = series.nunique()
        total_len = max(len(series), 1)
        if nunique <= 30 and (nunique / total_len < 0.5 or total_len <= 30):
            return "category"
        return "text"
    except Exception:
        return "text"


def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    columns = []
    date_cols = []
    numeric_cols = []
    category_cols = []

    for col in df.columns:
        try:
            col_type = infer_column_type(df[col])
            non_nulls = df[col].dropna()
            sample_vals = [str(x) if not pd.isna(x) else None for x in non_nulls.head(3).tolist()]
            
            info = {
                "name": str(col),
                "type": col_type,
                "nulls": int(df[col].isna().sum()),
                "unique": int(df[col].nunique()),
                "sample": sample_vals,
            }

            if col_type == "numeric":
                try:
                    num_series = pd.to_numeric(df[col], errors="coerce").dropna()
                    if not num_series.empty:
                        info["min"] = float(num_series.min())
                        info["max"] = float(num_series.max())
                        info["mean"] = float(num_series.mean())
                        info["sum"] = float(num_series.sum())
                        numeric_cols.append(col)
                    else:
                        info["type"] = "text"
                except Exception:
                    info["type"] = "text"

            elif col_type == "date":
                try:
                    parsed = pd.to_datetime(df[col], errors="coerce").dropna()
                    if not parsed.empty:
                        info["min_date"] = str(parsed.min().date())
                        info["max_date"] = str(parsed.max().date())
                        date_cols.append(col)
                    else:
                        info["type"] = "text"
                except Exception:
                    info["type"] = "text"

            if info["type"] == "category":
                try:
                    vc = df[col].astype(str).value_counts().head(5).to_dict()
                    info["top_values"] = {str(k): int(v) for k, v in vc.items()}
                    category_cols.append(col)
                except Exception:
                    pass

            columns.append(info)
        except Exception:
            columns.append({
                "name": str(col),
                "type": "text",
                "nulls": 0,
                "unique": 0,
                "sample": [],
            })

    kpis = compute_kpis(df, numeric_cols, category_cols)

    return {
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": columns,
        "numeric_cols": numeric_cols,
        "date_cols": date_cols,
        "category_cols": category_cols,
        "kpis": kpis,
    }


def compute_kpis(df: pd.DataFrame, numeric_cols: list, category_cols: list) -> list:
    kpis = []
    for col in numeric_cols[:4]:
        try:
            num_series = pd.to_numeric(df[col], errors="coerce").dropna()
            if not num_series.empty:
                total = num_series.sum()
                mean = num_series.mean()
                kpis.append({
                    "label": f"Total {col}",
                    "value": round(float(total), 2),
                    "avg": round(float(mean), 2),
                    "col": col,
                })
        except Exception:
            pass
    return kpis
