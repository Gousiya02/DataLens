import pandas as pd
from typing import List, Dict, Any


def recommend_charts(df: pd.DataFrame, profile: dict) -> List[Dict[str, Any]]:
    charts = []
    numeric_cols = profile.get("numeric_cols", [])
    date_cols = profile.get("date_cols", [])
    category_cols = profile.get("category_cols", [])

    # 1. Line chart: date x numeric
    if date_cols and numeric_cols:
        for num_col in numeric_cols[:2]:
            date_col = date_cols[0]
            try:
                temp = df.copy()
                temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
                temp = temp.dropna(subset=[date_col])
                temp = temp.sort_values(date_col)
                grouped = temp.groupby(temp[date_col].dt.to_period("M"))[num_col].sum().reset_index()
                grouped[date_col] = grouped[date_col].astype(str)
                charts.append({
                    "id": f"line_{date_col}_{num_col}",
                    "type": "line",
                    "title": f"{num_col} over time",
                    "reason": "Date column detected — line chart shows trends",
                    "x": date_col,
                    "y": num_col,
                    "data": grouped.rename(columns={date_col: "x", num_col: "y"}).to_dict("records"),
                })
            except Exception:
                pass

    # 2. Bar chart: category x numeric
    if category_cols and numeric_cols:
        for cat_col in category_cols[:2]:
            for num_col in numeric_cols[:1]:
                try:
                    grouped = df.groupby(cat_col)[num_col].sum().reset_index()
                    grouped = grouped.sort_values(num_col, ascending=False).head(10)
                    charts.append({
                        "id": f"bar_{cat_col}_{num_col}",
                        "type": "bar",
                        "title": f"{num_col} by {cat_col}",
                        "reason": "Category vs numeric — bar chart shows comparison",
                        "x": cat_col,
                        "y": num_col,
                        "data": grouped.rename(columns={cat_col: "x", num_col: "y"}).to_dict("records"),
                    })
                except Exception:
                    pass

    # 3. Pie chart: category distribution
    if category_cols:
        cat_col = category_cols[0]
        try:
            vc = df[cat_col].value_counts().head(6).reset_index()
            vc.columns = ["name", "value"]
            charts.append({
                "id": f"pie_{cat_col}",
                "type": "pie",
                "title": f"Distribution of {cat_col}",
                "reason": "Single category column — pie shows proportion",
                "data": vc.to_dict("records"),
            })
        except Exception:
            pass

    # 4. Scatter: two numeric cols
    if len(numeric_cols) >= 2:
        x_col, y_col = numeric_cols[0], numeric_cols[1]
        try:
            sample = df[[x_col, y_col]].dropna().sample(min(200, len(df)), random_state=42)
            charts.append({
                "id": f"scatter_{x_col}_{y_col}",
                "type": "scatter",
                "title": f"{x_col} vs {y_col}",
                "reason": "Two numeric columns — scatter shows correlation",
                "x": x_col,
                "y": y_col,
                "data": sample.rename(columns={x_col: "x", y_col: "y"}).to_dict("records"),
            })
        except Exception:
            pass

    # 5. Horizontal bar: top N by first numeric
    if category_cols and numeric_cols:
        cat_col = category_cols[0]
        num_col = numeric_cols[0]
        try:
            grouped = df.groupby(cat_col)[num_col].sum().reset_index()
            grouped = grouped.sort_values(num_col, ascending=False).head(8)
            charts.append({
                "id": f"hbar_{cat_col}_{num_col}",
                "type": "hbar",
                "title": f"Top {cat_col} by {num_col}",
                "reason": "Ranked comparison — horizontal bar for readability",
                "x": cat_col,
                "y": num_col,
                "data": grouped.rename(columns={cat_col: "x", num_col: "y"}).to_dict("records"),
            })
        except Exception:
            pass

    # 6. Fallback chart if no standard charts generated
    if not charts and len(df.columns) >= 1:
        try:
            # Bar chart of value counts of first string/object column
            first_col = df.columns[0]
            vc = df[first_col].astype(str).value_counts().head(8).reset_index()
            vc.columns = ["x", "y"]
            charts.append({
                "id": "fallback_bar_1",
                "type": "bar",
                "title": f"Top entries in {first_col}",
                "reason": "Overview of values in column",
                "x": first_col,
                "y": "Count",
                "data": vc.to_dict("records"),
            })
        except Exception:
            pass

        if len(df.columns) >= 2:
            try:
                # Bar chart of second column if first column is unique identifiers
                second_col = df.columns[1]
                vc = df[second_col].astype(str).value_counts().head(8).reset_index()
                vc.columns = ["x", "y"]
                charts.append({
                    "id": "fallback_bar_2",
                    "type": "hbar",
                    "title": f"Distribution in {second_col}",
                    "reason": "Overview of values in second column",
                    "x": second_col,
                    "y": "Count",
                    "data": vc.to_dict("records"),
                })
            except Exception:
                pass

    return charts
