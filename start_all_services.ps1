# Stop any processes currently listening on ports 3001 (Node.js API) and 5000 (Python LLM)
Write-Host "Checking for and terminating processes on ports 3001 and 5000..."
$ports = @(3001, 5000)
foreach ($port in $ports) {
    $pids = (netstat -ano | Select-String ":$port" | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique)
    foreach ($pid in $pids) {
        if ($pid -ne "0" -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
            Write-Host "Terminating process with PID $pid on port $port"
            Stop-Process -Id $pid -Force
        }
    }
}
Write-Host "Cleanup complete."

# Define log file directory
$tempDir = "C:\Users\Vyas S\.gemini\tmp\d7198bdd68bb958056d766e907e0d0e9215d79c7241608f69301d4e06c94ca1a"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null # Ensure temp directory exists

Write-Host "Starting Python LLM Backend..."
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "python emotional_ai_llm_web/app.py > '$tempDir\llm_output.log' 2> '$tempDir\llm_error.log'" -WorkingDirectory (Resolve-Path .)

Write-Host "Starting Node.js API Backend..."
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "npm start > '$tempDir\api_output.log' 2> '$tempDir\api_error.log'" -WorkingDirectory (Resolve-Path api)

Write-Host "Starting Frontend (Vite)..."
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "npm run dev > '$tempDir\frontend_output.log' 2> '$tempDir\frontend_error.log'" -WorkingDirectory (Resolve-Path frontend)

Write-Host "All services are attempting to start in the background."
Write-Host "Check the following log files for output and errors:"
Write-Host "  - LLM Backend: '$tempDir\llm_output.log', '$tempDir\llm_error.log'"
Write-Host "  - API Backend: '$tempDir\api_output.log', '$tempDir\api_error.log'"
Write-Host "  - Frontend:    '$tempDir\frontend_output.log', '$tempDir\frontend_error.log'"
Write-Host ""
Write-Host "The frontend should be accessible at http://localhost:5173 (or similar port if Vite changes it)."
Write-Host "You may need to refresh your browser after a moment."