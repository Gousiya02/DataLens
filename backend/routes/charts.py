import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProjectResult
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data
from services.chart_recommender import recommend_charts

from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()


class SyncChartsRequest(BaseModel):
    charts: List[Dict[str, Any]]


@router.get("/charts")
def get_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    df = DataStore.load_or_restore_df(current_user.id, db)
    if df is None:
        raise HTTPException(status_code=400, detail="No data loaded. Upload a file first.")

    profile = DataStore.get_profile(current_user.id)
    charts = recommend_charts(df, profile)

    project_id = DataStore.get_project_id(current_user.id)
    if project_id:
        result = db.query(ProjectResult).filter(ProjectResult.project_id == project_id).first()
        if result:
            result.charts_json = json.dumps(charts)
            db.commit()
        else:
            new_result = ProjectResult(
                project_id=project_id,
                charts_json=json.dumps(charts),
                profile_json=json.dumps(profile)
            )
            db.add(new_result)
            db.commit()

    return sanitize_json_data({"charts": charts})


@router.post("/charts/sync")
def sync_charts(
    req: SyncChartsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project_id = DataStore.get_project_id(current_user.id)
    if project_id:
        result = db.query(ProjectResult).filter(ProjectResult.project_id == project_id).first()
        if result:
            result.charts_json = json.dumps(req.charts)
            db.commit()
    return {"status": "success", "count": len(req.charts)}
