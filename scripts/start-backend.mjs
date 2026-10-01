// Starts the NOVA FastAPI backend on port 8000.
// Prefers the project virtualenv, falls back to system Python, and warns
// when Ollama is not reachable (chat then falls back to Groq or canned replies).

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const PORT = process.env.NOVA_PORT || '8000';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const venvPython = process.platform === 'win32'
  ? path.join(root, '.venv', 'Scripts', 'python.exe')
  : path.join(root, '.venv', 'bin', 'python');

let python = venvPython;
if (!existsSync(venvPython)) {
  python = process.platform === 'win32' ? 'python' : 'python3';
  console.warn('[nova] .venv not found — using system Python. To create it:');
  console.warn('  python -m venv .venv');
  console.warn('  ' + (process.platform === 'win32' ? '.venv\\Scripts\\pip' : '.venv/bin/pip') + ' install -r server/requirements.txt');
}

try {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2500) });
  const names = ((await res.json()).models || []).map((m) => m.name);
  console.log(`[nova] Ollama running — ${names.length} model(s): ${names.join(', ') || 'none'}`);
  if (names.length === 0) {
    console.warn('[nova] Ollama has no models. Pull one: ollama pull llama3.2:3b');
  }
} catch {
  console.warn(`[nova] Ollama not reachable at ${OLLAMA_HOST}. Chat will use Groq (if GROQ_API_KEY is set) or canned replies.`);
  console.warn('[nova] Start it with: ollama serve');
}

console.log(`[nova] Starting backend on http://localhost:${PORT} ...`);
const child = spawn(python, ['-m', 'uvicorn', 'fastapi_app:app', '--reload', '--port', PORT], {
  cwd: serverDir,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
