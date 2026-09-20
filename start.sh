#!/bin/bash
echo "🚀 Starting DataLens AI..."

# Start backend
cd backend
python -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"

echo ""
echo "📊 DataLens AI is ready at http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

wait
