import json
from typing import Optional
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Project, ProjectResult
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data
from services.data_profiler import profile_dataframe
from services.file_parser import parse_uploaded_file

router = APIRouter()


ALLOWED_POWERBI_EXTENSIONS = {
    ".csv", ".tsv", ".tab", ".psv",
    ".xlsx", ".xls", ".xlsm", ".xlsb", ".ods",
    ".json", ".jsonl", ".ndjson",
    ".xml",
    ".parquet", ".pq", ".feather", ".arrow", ".orc",
    ".db", ".sqlite", ".sqlite3"
}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filename_lower = file.filename.lower() if file.filename else ""
    if not filename_lower or filename_lower.endswith('/') or filename_lower.endswith('\\') or file.content_type == 'application/x-directory':
        raise HTTPException(
            status_code=400,
            detail="Folder uploads are not supported. Please select a Power BI data file."
        )

    if filename_lower.endswith(".zip") or file.content_type in ["application/zip", "application/x-zip-compressed"]:
        raise HTTPException(
            status_code=400,
            detail="ZIP folders and archives are not allowed. Please extract the ZIP folder and select the data file (CSV, Excel, JSON, XML, Parquet, SQLite) inside."
        )

    if not any(filename_lower.endswith(ext) for ext in ALLOWED_POWERBI_EXTENSIONS):
        ext_found = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'unknown'
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format (.{ext_found}). Only Power BI supported data sources (Excel, CSV, JSON, XML, Parquet, SQLite) are allowed. ZIP folders, documents, images, PDFs, videos, and text files are rejected."
        )

    content = await file.read()
    try:
        df = parse_uploaded_file(file.filename, content)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    name = project_name.strip() if (project_name and project_name.strip()) else file.filename.rsplit('.', 1)[0]
    row_count = len(df)
    col_count = len(df.columns)

    project = Project(
        user_id=current_user.id,
        project_name=name,
        filename=file.filename,
        row_count=row_count,
        column_count=col_count
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    profile = profile_dataframe(df)

    # Save to SQLite ProjectResult
    project_result = ProjectResult(
        project_id=project.id,
        profile_json=json.dumps(profile)
    )
    db.add(project_result)
    db.commit()

    # Save to session-based DataStore & disk
    DataStore.set(current_user.id, df, file.filename, project.id)
    DataStore.set_profile(current_user.id, profile)
    DataStore.save_dataset_file(project.id, df)

    return sanitize_json_data({
        "project_id": project.id,
        "project_name": project.project_name,
        "filename": file.filename,
        "rows": row_count,
        "columns": col_count,
        "profile": profile,
    })


@router.get("/status")
def status(current_user: User = Depends(get_current_user)):
    df = DataStore.get(current_user.id)
    if df is None:
        return {"loaded": False}
    return {
        "loaded": True,
        "filename": DataStore.get_filename(current_user.id),
        "rows": len(df),
        "columns": len(df.columns),
    }


@router.get("/download")
def download_dataset(current_user: User = Depends(get_current_user)):
    import io
    from fastapi.responses import StreamingResponse

    df = DataStore.get(current_user.id)
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded in active session.")

    orig_filename = DataStore.get_filename(current_user.id) or "dataset.csv"
    base_name = orig_filename.rsplit('.', 1)[0]
    out_filename = f"{base_name}_clean.csv"

    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={out_filename}"}
    )

