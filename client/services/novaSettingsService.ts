// Talks to the backend's model-management endpoints (/models, /settings, ...)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface OllamaModel {
  name: string;
  size: number;
  parameter_size: string;
  quantization: string;
  capabilities: string[];
}

export interface ProviderState {
  provider: string;            // "ollama" | "groq"
  model: string;
  available: boolean;
  settings: { provider: string; model: string; ollama_host: string };
  ollama: {
    host: string;
    running: boolean;
    models: OllamaModel[];
    model_present: boolean;
  };
  groq: { configured: boolean; model: string };
}

export interface PullState {
  active: boolean;
  model: string | null;
  status: string | null;
  completed: number;
  total: number;
  error: string | null;
}

export interface ModelTestResult {
  ok: boolean;
  reply?: string;
  error?: string;
  latency_ms: number;
  provider: string;
  model: string;
}

export interface HealthState {
  status: string;
  llm_provider: string | null;
  llm_model: string | null;
  llm_available: boolean;
  ollama: { running: boolean; models: number };
  emotion_modalities: { text: boolean; face: boolean; voice: boolean };
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.detail || `Request failed (${res.status})`);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

export const getProviderState = () => request<ProviderState>('/models');

export const updateSettings = (update: {
  provider?: string;
  model?: string;
  ollama_host?: string;
}) => request<ProviderState>('/settings', { method: 'POST', body: JSON.stringify(update) });

export const testActiveModel = () =>
  request<ModelTestResult>('/models/test', { method: 'POST' }, 60000);

export const startModelPull = (name: string) =>
  request<{ started: boolean; model: string }>('/models/pull', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const getPullState = () => request<PullState>('/models/pull', undefined, 5000);

export const getBackendHealth = () => request<HealthState>('/health', undefined, 5000);

export function formatBytes(bytes: number): string {
  if (!bytes) return '';
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export function isChatCapable(model: OllamaModel): boolean {
  // Ollama reports "completion" for models that can serve /api/chat
  return (
    model.capabilities.length === 0 ||
    model.capabilities.includes('completion') ||
    model.capabilities.includes('chat')
  );
}
