@echo off
echo Starting CrowdFlow X Lite Backend (Python FastAPI)...
start cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting CrowdFlow X Lite Frontend (Next.js React)...
start cmd /k "cd frontend && npm run dev"

echo Both services are starting up in separate windows! 
echo You can access the UI at: http://localhost:3000
