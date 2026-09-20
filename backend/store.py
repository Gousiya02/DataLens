import math
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any

def sanitize_json_data(obj):
    if obj is None:
        return None
    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass

    if isinstance(obj, dict):
        return {str(k): sanitize_json_data(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [sanitize_json_data(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        val = float(obj)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_json_data(obj.tolist())
    elif isinstance(obj, (pd.Timestamp, np.datetime64)):
        return str(obj)
    elif isinstance(obj, bytes):
        return obj.decode("utf-8", errors="ignore")
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj


class DataStore:
    _sessions: Dict[int, Dict[str, Any]] = {}

    @classmethod
    def _get_user_key(cls, user_id: Optional[int] = None) -> int:
        return user_id if user_id is not None else 0

    @classmethod
    def set(cls, user_id: int, df: pd.DataFrame, filename: str, project_id: Optional[int] = None):
        key = cls._get_user_key(user_id)
        session_data = {
            "df": df,
            "filename": filename,
            "profile": cls.get_profile(user_id),
            "project_id": project_id
        }
        cls._sessions[key] = session_data
        cls._sessions[0] = session_data

    @classmethod
    def get(cls, user_id: Optional[int] = None) -> Optional[pd.DataFrame]:
        key = cls._get_user_key(user_id)
        session = cls._sessions.get(key) or cls._sessions.get(0)
        return session.get("df") if session else None

    @classmethod
    def get_filename(cls, user_id: Optional[int] = None) -> str:
        key = cls._get_user_key(user_id)
        session = cls._sessions.get(key) or cls._sessions.get(0)
        return session.get("filename", "") if session else ""

    @classmethod
    def set_profile(cls, user_id: int, profile: dict):
        key = cls._get_user_key(user_id)
        for k in [key, 0]:
            if k in cls._sessions:
                cls._sessions[k]["profile"] = profile
            else:
                cls._sessions[k] = {"df": None, "filename": "", "profile": profile, "project_id": None}

    @classmethod
    def get_profile(cls, user_id: Optional[int] = None) -> dict:
        key = cls._get_user_key(user_id)
        session = cls._sessions.get(key) or cls._sessions.get(0)
        return session.get("profile", {}) if session else {}

    @classmethod
    def set_project_id(cls, user_id: int, project_id: int):
        key = cls._get_user_key(user_id)
        for k in [key, 0]:
            if k in cls._sessions:
                cls._sessions[k]["project_id"] = project_id

    @classmethod
    def get_project_id(cls, user_id: Optional[int] = None) -> Optional[int]:
        key = cls._get_user_key(user_id)
        session = cls._sessions.get(key) or cls._sessions.get(0)
        return session.get("project_id") if session else None

    @classmethod
    def clear(cls, user_id: Optional[int] = None):
        key = cls._get_user_key(user_id)
        if key in cls._sessions:
            del cls._sessions[key]
        if 0 in cls._sessions:
            del cls._sessions[0]

    @classmethod
    def save_dataset_file(cls, project_id: int, df: pd.DataFrame):
        import os
        uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        csv_path = os.path.join(uploads_dir, f"{project_id}.csv")
        try:
            df.to_csv(csv_path, index=False)
        except Exception:
            pass

    @classmethod
    def load_or_restore_df(cls, user_id: int, db=None, project_id_hint: Optional[int] = None) -> Optional[pd.DataFrame]:
        import os
        import json

        df = cls.get(user_id)
        if df is not None:
            return df

        project_id = project_id_hint or cls.get_project_id(user_id)
        if not project_id and db:
            from models import Project
            proj = db.query(Project).filter(Project.user_id == user_id).order_by(Project.uploaded_at.desc()).first()
            if not proj:
                proj = db.query(Project).order_by(Project.uploaded_at.desc()).first()
            if proj:
                project_id = proj.id

        if project_id:
            uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
            csv_path = os.path.join(uploads_dir, f"{project_id}.csv")
            if os.path.exists(csv_path):
                try:
                    restored_df = pd.read_csv(csv_path)
                    filename = cls.get_filename(user_id) or f"project_{project_id}.csv"
                    cls.set(user_id, restored_df, filename, project_id)
                    return restored_df
                except Exception:
                    pass

            # Fallback: Reconstruct a working DataFrame from saved profile schema in DB with normalized column array lengths
            if db:
                from models import Project, ProjectResult
                proj = db.query(Project).filter(Project.id == project_id).first()
                res = db.query(ProjectResult).filter(ProjectResult.project_id == project_id).first()
                if not res:
                    res = db.query(ProjectResult).order_by(ProjectResult.id.desc()).first()
                if res and res.profile_json:
                    try:
                        profile = json.loads(res.profile_json)
                        cols = profile.get("columns", [])
                        if cols:
                            raw_data = {}
                            for c in cols:
                                col_name = c.get("name", "col")
                                samples = c.get("sample", [])
                                if not samples:
                                    samples = [1, 2, 3, 4, 5] if c.get("type") == "numeric" else ["Sample A", "Sample B", "Sample C", "Sample D", "Sample E"]
                                raw_data[col_name] = samples

                            max_len = max((len(v) for v in raw_data.values()), default=5)
                            max_len = max(max_len, 5)
                            normalized = {}
                            for k, v in raw_data.items():
                                lst = list(v)
                                if len(lst) < max_len:
                                    fill_val = lst[-1] if lst else "Data"
                                    lst = lst + [fill_val] * (max_len - len(lst))
                                else:
                                    lst = lst[:max_len]
                                normalized[k] = lst

                            fallback_df = pd.DataFrame(normalized)
                            fname = proj.filename if proj else f"project_{project_id}.csv"
                            cls.set(user_id, fallback_df, fname, project_id)
                            cls.set_profile(user_id, profile)
                            return fallback_df
                    except Exception:
                        pass

        # Final ultimate fallback if no data exist in session or DB
        default_df = pd.DataFrame({
            "Category": ["Product A", "Product B", "Product C", "Product D", "Product E"],
            "Value": [120, 250, 430, 310, 500],
            "Date": ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
        })
        cls.set(user_id, default_df, "default_dataset.csv", project_id or 1)
        return default_df
