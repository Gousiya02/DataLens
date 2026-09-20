import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProjectResult
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data
from services.ai_summary import generate_summary
from services.anomaly_detector import detect_anomalies

router = APIRouter()


@router.get("/summary")
async def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    df = DataStore.load_or_restore_df(current_user.id, db)
    if df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    profile = DataStore.get_profile(current_user.id)
    anomalies = detect_anomalies(df, profile)
    try:
        summary = await generate_summary(profile, anomalies)
    except Exception as e:
        summary = f"Summary unavailable: {str(e)}"

    project_id = DataStore.get_project_id(current_user.id)
    if project_id:
        result = db.query(ProjectResult).filter(ProjectResult.project_id == project_id).first()
        if result:
            result.summary_text = summary
            db.commit()
        else:
            new_result = ProjectResult(
                project_id=project_id,
                summary_text=summary,
                profile_json=json.dumps(profile)
            )
            db.add(new_result)
            db.commit()

    return sanitize_json_data({"summary": summary})
