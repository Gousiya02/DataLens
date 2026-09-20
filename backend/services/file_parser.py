import io
import os
import re
import json
import sqlite3
import zipfile
import pandas as pd
import numpy as np


def clean_dataframe(df: pd.DataFrame, filename: str) -> pd.DataFrame:
    """Ensure clean column names and non-empty dataframe."""
    if df is None or df.empty:
        df = pd.DataFrame([
            {"Property": "Status", "Value": "File was empty or had no tabular data"},
            {"Property": "Filename", "Value": filename}
        ])

    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ["_".join([str(x) for x in col if str(x) != ""]).strip() for col in df.columns.values]

    # Flatten MultiIndex index if present
    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index()
    elif not isinstance(df.index, pd.RangeIndex):
        df = df.reset_index()

    # Drop auto-generated index columns (e.g. Unnamed: 0) if valid data columns exist
    unnamed_cols = [c for c in df.columns if str(c).lower().startswith("unnamed:") or str(c).lower() == "index"]
    if unnamed_cols and len(df.columns) > len(unnamed_cols):
        df = df.drop(columns=unnamed_cols)

    # Clean column names
    cols = []
    seen = set()
    for i, c in enumerate(df.columns):
        name = str(c).strip() if c is not None and str(c).strip() != "" else f"col_{i+1}"
        orig_name = name
        count = 1
        while name in seen:
            name = f"{orig_name}_{count}"
            count += 1
        seen.add(name)
        cols.append(name)
    df.columns = cols

    # Convert non-serializable object types (dicts/lists) to string representations
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)

    return df


ALLOWED_POWERBI_EXTENSIONS = {
    ".csv", ".tsv", ".tab", ".psv",
    ".xlsx", ".xls", ".xlsm", ".xlsb", ".ods",
    ".json", ".jsonl", ".ndjson",
    ".xml",
    ".parquet", ".pq", ".feather", ".arrow", ".orc",
    ".db", ".sqlite", ".sqlite3"
}


def parse_uploaded_file(filename: str, content: bytes) -> pd.DataFrame:
    """Parse only Power BI supported data files (Excel, CSV, JSON, XML, Parquet, SQLite). Rejects ZIP folders, documents, images, PDFs, videos."""
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".zip":
        raise ValueError("ZIP folders and archives are not allowed. Please extract the ZIP folder and select the data file (CSV, Excel, JSON, XML, Parquet, SQLite) inside.")

    if not any(filename.lower().endswith(allowed_ext) for allowed_ext in ALLOWED_POWERBI_EXTENSIONS):
        raise ValueError(f"Unsupported file format '{ext or 'unknown'}'. Accept only Power BI data sources (Excel .xlsx/.xls, CSV, JSON, XML, Parquet, SQLite). ZIP folders, documents, images, PDFs, videos, and text files are rejected.")

    # 1. Structured CSV / TSV / Delimited files
    if ext in [".csv", ".tsv", ".tab", ".psv", ".ssv"] or ext == "":
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]:
            # Try common explicit separators first
            for sep in [",", "\t", ";", "|"]:
                try:
                    df = pd.read_csv(io.BytesIO(content), sep=sep, encoding=encoding)
                    if df is not None and not df.empty and len(df.columns) > 1:
                        return clean_dataframe(df, filename)
                except Exception:
                    pass

            try:
                df = pd.read_csv(io.BytesIO(content), sep=None, engine="python", encoding=encoding)
                if df is not None and not df.empty:
                    return clean_dataframe(df, filename)
            except Exception:
                pass

    # 2. Excel Spreadsheets
    if ext in [".xlsx", ".xls", ".xlsm", ".xlsb", ".ods", ".xltx"]:
        try:
            excel_file = pd.ExcelFile(io.BytesIO(content))
            sheet_names = excel_file.sheet_names
            if sheet_names:
                best_df = None
                max_rows = -1
                for s in sheet_names:
                    try:
                        temp_df = pd.read_excel(excel_file, sheet_name=s)
                        if len(temp_df) > max_rows:
                            max_rows = len(temp_df)
                            best_df = temp_df
                    except Exception:
                        pass
                if best_df is not None:
                    return clean_dataframe(best_df, filename)
        except Exception:
            pass

    # 3. JSON / JSONL / NDJSON
    if ext in [".json", ".jsonl", ".ndjson"]:
        try:
            text = content.decode("utf-8", errors="ignore").strip()
            try:
                data = json.loads(text)
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                    return clean_dataframe(df, filename)
                elif isinstance(data, dict):
                    for key in ["data", "records", "items", "rows", "results", "value"]:
                        if key in data and isinstance(data[key], list) and len(data[key]) > 0:
                            df = pd.DataFrame(data[key])
                            return clean_dataframe(df, filename)
                    df = pd.json_normalize(data)
                    return clean_dataframe(df, filename)
            except Exception:
                pass

            lines = [json.loads(line) for line in text.splitlines() if line.strip()]
            if lines:
                df = pd.DataFrame(lines)
                return clean_dataframe(df, filename)
        except Exception:
            pass

    # 4. Parquet / Feather / ORC
    if ext in [".parquet", ".pq"]:
        try:
            df = pd.read_parquet(io.BytesIO(content))
            return clean_dataframe(df, filename)
        except Exception:
            pass

    if ext in [".feather", ".arrow"]:
        try:
            df = pd.read_feather(io.BytesIO(content))
            return clean_dataframe(df, filename)
        except Exception:
            pass

    if ext in [".orc"]:
        try:
            df = pd.read_orc(io.BytesIO(content))
            return clean_dataframe(df, filename)
        except Exception:
            pass

    # 5. SQLite database files
    if ext in [".sqlite", ".db", ".sqlite3"]:
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            conn = sqlite3.connect(tmp_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            if tables:
                table_name = tables[0][0]
                df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
                conn.close()
                os.remove(tmp_path)
                return clean_dataframe(df, filename)
            conn.close()
            os.remove(tmp_path)
        except Exception:
            pass

    # 6. XML / HTML
    if ext in [".xml", ".html", ".htm"]:
        try:
            dfs = pd.read_html(io.BytesIO(content))
            if dfs:
                best_df = max(dfs, key=len)
                return clean_dataframe(best_df, filename)
        except Exception:
            pass
        try:
            df = pd.read_xml(io.BytesIO(content))
            return clean_dataframe(df, filename)
        except Exception:
            pass

    # 7. ZIP Archives
    if ext == ".zip":
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                files_in_zip = z.namelist()
                for inner_file in files_in_zip:
                    inner_ext = os.path.splitext(inner_file)[1].lower()
                    if inner_ext in [".txt", ".text"]:
                        continue
                    if inner_ext in [".csv", ".tsv", ".xlsx", ".xls", ".json", ".parquet", ".sqlite", ".db"] and not inner_file.startswith("__MACOSX"):
                        inner_bytes = z.read(inner_file)
                        return parse_uploaded_file(inner_file, inner_bytes)
                manifest = [{"Filename": f.filename, "Size": f.file_size, "Compressed_Size": f.compress_size} for f in z.infolist() if not f.filename.lower().endswith((".txt", ".text"))]
                return clean_dataframe(pd.DataFrame(manifest), filename)
        except Exception:
            pass

    raise ValueError(f"Could not parse '{filename}'. Please ensure the file contains valid tabular data supported by Power BI (Excel, CSV, JSON, XML, Parquet, or SQLite). Documents, images, PDFs, videos, and non-data files are rejected.")
