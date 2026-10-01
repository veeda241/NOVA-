import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, RefreshCw, Check, AlertTriangle, Loader2, Play,
  Download, Trash2, Server, Cloud, HardDrive, ShieldCheck, Cpu, Zap,
} from 'lucide-react';
import {
  getProviderState, updateSettings, testActiveModel, startModelPull,
  getPullState, getBackendHealth, formatBytes, isChatCapable,
  ProviderState, PullState, ModelTestResult, HealthState,
} from '../services/novaSettingsService';
import { getSessions, clearAllSessions, exportSessions } from '../services/chatStorage';

interface SettingsPageProps {
  onBack: () => void;
}

const PROVIDERS = [
  { id: 'auto', label: 'Auto', hint: 'Ollama if running, else Groq', icon: Zap },
  { id: 'ollama', label: 'Ollama', hint: 'Local models, private', icon: HardDrive },
  { id: 'groq', label: 'Groq', hint: 'Cloud API (needs key)', icon: Cloud },
];

const SUGGESTED_MODELS = ['llama3.2:3b', 'qwen2.5:3b', 'gemma3:4b', 'phi4-mini'];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [state, setState] = useState<ProviderState | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [provider, setProvider] = useState('auto');
  const [model, setModel] = useState('');
  const [host, setHost] = useState('');
  const [customModel, setCustomModel] = useState('');

  const [applying, setApplying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ModelTestResult | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pull, setPull] = useState<PullState | null>(null);
  const [sessionCount, setSessionCount] = useState(getSessions().length);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const st = await getProviderState();
      setState(st);
      setProvider(st.settings.provider);
      setModel(st.settings.model);
      setHost(st.settings.ollama_host);
      // /health is a slow secondary check (it pings Ollama) — never block
      // the page on it, and keep the last good result if it times out.
      getBackendHealth()
        .then((h) => {
          setHealth(h);
          setHealthError(false);
        })
        .catch(() => setHealthError(true));
    } catch (e: any) {
      setLoadError(e.message || 'Backend unreachable. Is the server running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll progress while a model download is running
  useEffect(() => {
    if (!pull?.active) return;
    const timer = setInterval(async () => {
      try {
        const p = await getPullState();
        setPull(p);
        if (!p.active && !p.error) {
          getProviderState().then((st) => {
            setState(st);
            setNotice({ kind: 'ok', text: `Model "${p.model}" downloaded. Select it and click Apply.` });
          }).catch(() => {});
        }
      } catch {
        /* backend busy pulling — keep polling */
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [pull?.active]);

  const modelOptions = state?.ollama.models ?? [];
  const savedModelInstalled = modelOptions.some(
    (m) => m.name === model || m.name.startsWith(model + ':')
  );
  const selectedMeta = modelOptions.find(
    (m) => m.name === model || m.name.startsWith(model + ':')
  );

  const handleApply = async () => {
    setApplying(true);
    setNotice(null);
    setTestResult(null);
    try {
      const st = await updateSettings({
        provider,
        model: customModel.trim() || model,
        ollama_host: host,
      });
      setState(st);
      setProvider(st.settings.provider);
      setModel(st.settings.model);
      setHost(st.settings.ollama_host);
      setCustomModel('');
      setNotice({ kind: 'ok', text: `Saved — NOVA is now using ${st.provider} · ${st.model}` });
      getBackendHealth()
        .then((h) => {
          setHealth(h);
          setHealthError(false);
        })
        .catch(() => setHealthError(true));
    } catch (e: any) {
      setNotice({ kind: 'err', text: e.message });
    } finally {
      setApplying(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testActiveModel());
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message, latency_ms: 0, provider: '', model: '' });
    } finally {
      setTesting(false);
    }
  };

  const handlePull = async () => {
    const name = customModel.trim();
    if (!name) return;
    setNotice(null);
    try {
      await startModelPull(name);
      setPull({ active: true, model: name, status: 'starting', completed: 0, total: 0, error: null });
    } catch (e: any) {
      setNotice({ kind: 'err', text: e.message });
    }
  };

  const handleClearSessions = () => {
    if (!confirm(`Delete all ${sessionCount} conversations? This cannot be undone.`)) return;
    clearAllSessions();
    setSessionCount(0);
    setNotice({ kind: 'ok', text: 'All conversations deleted.' });
  };

  const handleExport = () => {
    exportSessions();
    setNotice({ kind: 'ok', text: 'Conversations exported as JSON.' });
  };

  const pullPct = pull?.total ? Math.round((pull.completed / pull.total) * 100) : 0;

  const cardClass = 'bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6';
  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {notice && (
          <div
            className={`mb-6 p-3 rounded-xl text-sm border ${
              notice.kind === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {notice.text}
          </div>
        )}

        {loadError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{loadError} Start it with <code className="bg-slate-800 px-1.5 py-0.5 rounded">npm run dev</code> from the project root.</span>
          </div>
        )}

        {/* AI Model */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={20} className="text-indigo-400" />
              AI Model
            </h2>
            {state && (
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${state.available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-slate-400 font-mono">
                  {state.provider} · {state.model}
                </span>
                {!state.available && <span className="text-red-400">(unavailable)</span>}
              </div>
            )}
          </div>

          {/* Provider selector */}
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Provider</label>
          <div className="grid grid-cols-3 gap-2 mt-2 mb-5">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  title={p.hint}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-indigo-400' : ''} />
                  {p.label}
                  <span className="text-[10px] font-normal text-slate-500">{p.hint}</span>
                </button>
              );
            })}
          </div>

          {/* Model dropdown */}
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Installed Ollama models
          </label>
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setCustomModel('');
            }}
            className={`${inputClass} mt-2 mb-1`}
            disabled={!state || !state.ollama.running}
          >
            {modelOptions.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} · {m.parameter_size} · {m.quantization}
                {formatBytes(m.size) ? ` · ${formatBytes(m.size)}` : ''}
                {isChatCapable(m) ? '' : ' — no chat support'}
              </option>
            ))}
            {!savedModelInstalled && model && (
              <option value={model}>{model} — not installed</option>
            )}
          </select>
          {!state?.ollama.running && (
            <p className="text-amber-400 text-xs mt-1 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Ollama is not running at {state?.ollama.host || 'localhost:11434'}. Start it with <code className="bg-slate-800 px-1 rounded">ollama serve</code>.
            </p>
          )}
          {selectedMeta && !isChatCapable(selectedMeta) && (
            <p className="text-amber-400 text-xs mt-1 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              This model was built for tools only and will fail chat requests. Pick a completion model.
            </p>
          )}

          {/* Pull a new model */}
          <div className="mt-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Download a new model
            </label>
            <div className="flex gap-2 mt-2">
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Ollama tag, e.g. llama3.2:3b"
                className={inputClass}
                onKeyDown={(e) => e.key === 'Enter' && handlePull()}
              />
              <button
                onClick={handlePull}
                disabled={!customModel.trim() || !!pull?.active}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pull?.active ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Pull
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => setCustomModel(m)}
                  className="text-[11px] px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/50 transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>

            {pull && (pull.active || pull.error) && (
              <div className="mt-3 p-3 rounded-lg bg-slate-800/70 border border-slate-700">
                {pull.error ? (
                  <p className="text-red-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Download failed: {pull.error}
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span className="font-mono">{pull.model} — {pull.status}</span>
                      <span>{pull.total ? `${pullPct}% · ${formatBytes(pull.completed)} / ${formatBytes(pull.total)}` : 'starting...'}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pullPct}%` }} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Ollama host */}
          <div className="mt-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Ollama host
            </label>
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://localhost:11434"
              className={`${inputClass} mt-2 font-mono`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleApply}
              disabled={applying || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/20"
            >
              {applying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Apply
            </button>
            <button
              onClick={handleTest}
              disabled={testing || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Test active model
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 border ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>
                {testResult.ok
                  ? <>Replied in {testResult.latency_ms} ms with “{testResult.reply}” ({testResult.provider} · {testResult.model})</>
                  : <>{testResult.error}</>}
              </span>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className={cardClass}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
            <Server size={20} className="text-indigo-400" />
            System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatusChip label="Backend" value={state ? 'Online' : 'Offline'} ok={!!state} />
            <StatusChip
              label="Ollama"
              value={state?.ollama.running ? `Running · ${state.ollama.models.length} models` : state ? 'Stopped' : '—'}
              ok={state ? state.ollama.running : undefined}
            />
            <StatusChip
              label="Chat brain"
              value={state ? `${state.model}` : '—'}
              ok={state ? state.available : undefined}
              mono
            />
            <StatusChip label="Text emotions" value={health ? (health.emotion_modalities.text ? 'Enabled' : 'Off') : '—'} ok={health ? health.emotion_modalities.text : undefined} />
            <StatusChip label="Face emotions" value={health ? (health.emotion_modalities.face ? 'Enabled' : 'Off') : '—'} ok={health ? health.emotion_modalities.face : undefined} />
            <StatusChip label="Voice emotions" value={health ? (health.emotion_modalities.voice ? 'Enabled' : 'Off') : '—'} ok={health ? health.emotion_modalities.voice : undefined} />
          </div>
          {healthError && (
            <p className="text-amber-400 text-xs mt-3 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              The /health check did not respond — status may be stale. Click Refresh to retry.
            </p>
          )}
        </div>

        {/* Data & Privacy */}
        <div className={cardClass}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            Data &amp; Privacy
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            Conversations are stored only in this browser. With the Ollama provider, messages never
            leave your machine.
          </p>
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg mb-4">
            <span className="text-slate-300 text-sm">Saved conversations</span>
            <span className="text-sm font-mono text-indigo-300">{sessionCount}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={sessionCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors"
            >
              <Download size={15} />
              Export conversations
            </button>
            <button
              onClick={handleClearSessions}
              disabled={sessionCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 disabled:opacity-40 transition-colors"
            >
              <Trash2 size={15} />
              Delete all
            </button>
          </div>
        </div>

        {/* About */}
        <div className={cardClass}>
          <h2 className="text-lg font-bold text-white mb-3">About NOVA</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            NOVA is a multimodal emotional AI companion. It reads emotion from your text, facial
            expressions and voice, then responds with empathy generated by a local LLM — your
            conversations stay on your device.
          </p>
          <p className="text-slate-600 text-xs mt-3 font-mono">NOVA v1.0 · local-first emotional AI</p>
        </div>

      </div>
    </div>
  );
};

const StatusChip: React.FC<{ label: string; value: string; ok?: boolean; mono?: boolean }> = ({
  label, value, ok, mono,
}) => (
  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
    <div className="flex items-center gap-1.5 mb-1">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok === undefined ? 'bg-slate-500' : ok ? 'bg-emerald-400' : 'bg-red-400'
        }`}
      />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-sm text-slate-200 truncate ${mono ? 'font-mono' : ''}`} title={value}>{value}</p>
  </div>
);
