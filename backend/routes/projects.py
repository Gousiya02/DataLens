import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Project, ProjectResult
from services.auth_service import get_current_user
from store import DataStore, sanitize_json_data

router = APIRouter()


@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.uploaded_at.desc())
        .all()
    )
    res = [
        {
            "id": p.id,
            "project_name": p.project_name,
            "filename": p.filename,
            "uploaded_at": p.uploaded_at.isoformat() if p.uploaded_at else None,
            "row_count": p.row_count,
            "column_count": p.column_count,
        }
        for p in projects
    ]
    return sanitize_json_data(res)


@router.get("/projects/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = (
        db.query(ProjectResult)
        .filter(ProjectResult.project_id == project_id)
        .first()
    )

    charts = json.loads(result.charts_json) if (result and result.charts_json) else []
    profile = json.loads(result.profile_json) if (result and result.profile_json) else {}
    summary = result.summary_text if result else ""

    # Set profile, filename & restore dataset DataFrame in DataStore for user session
    DataStore.set_profile(current_user.id, profile)
    DataStore.set_project_id(current_user.id, project.id)
    DataStore.load_or_restore_df(current_user.id, db, project_id_hint=project_id)

    res = {
        "id": project.id,
        "project_name": project.project_name,
        "filename": project.filename,
        "uploaded_at": project.uploaded_at.isoformat() if project.uploaded_at else None,
        "row_count": project.row_count,
        "column_count": project.column_count,
        "profile": profile,
        "charts": charts,
        "summary": summary
    }
    return sanitize_json_data(res)


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    if DataStore.get_project_id(current_user.id) == project_id:
        DataStore.clear(current_user.id)

    return {"detail": "Project deleted successfully"}


@router.get("/projects/{project_id}/download")
def download_project_dataset(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import io
    from fastapi.responses import StreamingResponse

    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    df = DataStore.load_or_restore_df(current_user.id, db, project_id_hint=project_id)
    if df is None:
        raise HTTPException(status_code=400, detail="Dataset not found for this project.")

    orig_filename = project.filename or f"project_{project_id}.csv"
    base_name = orig_filename.rsplit('.', 1)[0]
    out_filename = f"{base_name}_clean.csv"

    stream = io.StringIO()
    df.to_csv(stream, index=False)

    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={out_filename}"}
    )
