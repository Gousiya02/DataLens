from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from models import User
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data
from services.nl_to_sql import nl_to_sql

from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


@router.post("/query")
async def query_data(
    req: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    df = DataStore.load_or_restore_df(current_user.id, db)
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset found for current session. Please select a project or upload a dataset.")
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is empty.")
    try:
        result = await nl_to_sql(req.question, df)
        return sanitize_json_data(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
