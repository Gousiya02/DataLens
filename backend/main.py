from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routes import upload, charts, query, anomaly, summary, auth, projects

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataLens AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(charts.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(anomaly.router, prefix="/api")
app.include_router(summary.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "DataLens AI running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
