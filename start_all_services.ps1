# Start Python Backend
Write-Host "Starting Python Backend..."
$venvPath = ".venv\Scripts\Activate.ps1"

if (Test-Path $venvPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$venvPath'; cd server; python -m uvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --reload"
} else {
    Write-Host "Virtual environment not found at $venvPath. Attempting to run with system python..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; python -m uvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --reload"
}

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "All services started."
Write-Host "Frontend: http://localhost:5174"
Write-Host "Backend: http://localhost:8000"