# Start Python Backend
Write-Host "Starting Python Backend..."
$venvPath = ".venv\Scripts\Activate.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$venvPath'; cd emotional_ai_llm_web; python -m uvicorn fastapi_app:app --port 5000 --reload"

# Start Node Proxy
Write-Host "Starting Node Proxy..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm start"

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All services started. Please wait for them to initialize."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend Proxy: http://localhost:3001"
Write-Host "Python API: http://localhost:5000"
