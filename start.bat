@echo off
echo Starting DataLens AI...

start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
timeout /t 3
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo DataLens AI starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
