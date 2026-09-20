from fastapi import APIRouter, HTTPException, Depends
from models import User
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data
from services.anomaly_detector import detect_anomalies

from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()


@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    df = DataStore.load_or_restore_df(current_user.id, db)
    profile = DataStore.get_profile(current_user.id)
    if df is None:
        return sanitize_json_data({"anomalies": []})

    anomalies = detect_anomalies(df, profile)
    return sanitize_json_data({"anomalies": anomalies})
