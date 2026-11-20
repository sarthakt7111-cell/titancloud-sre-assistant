import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Sliders,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Save,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ onConfigUpdated }) {
  const [config, setConfig] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [topK, setTopK] = useState(4);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
      if (data.rag_top_k) setTopK(data.rag_top_k);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        rag_top_k: Number(topK),
      };
      if (apiKeyInput.trim()) {
        payload.gemini_api_key = apiKeyInput.trim();
      }

      await api.updateConfig(payload);
      setSuccessMsg("Settings updated successfully and persisted to environment.");
      setApiKeyInput('');
      await loadConfig();
      if (onConfigUpdated) onConfigUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update configuration");
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6">
        <h2 className="text-base font-bold text-white">System Settings & RAG Hyperparameters</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your Google Gemini API key, vector retrieval depth, and strict grounding instructions.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Gemini API Key Box */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Google Gemini API Key</h3>
                <p className="text-xs text-gray-400">Used for grounded LLM inference with system instructions</p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={config?.gemini_api_key_configured ? `Active Key: ${config.gemini_api_key_masked} (enter new key to update)` : 'AIzaSy...'}
              className="w-full bg-[#141B2D] border border-[#1E293B] rounded-lg px-4 py-2.5 text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config?.gemini_api_key_configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              Status: {config?.gemini_api_key_configured ? 'API Key Configured & Ready' : 'API Key Not Set (Using Extractive Engine)'}
            </span>
            <span className="text-[11px] font-mono text-gray-400">Model: gemini-1.5-flash</span>
          </div>
        </div>

        {/* RAG Retrieval Parameters */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Retrieval Hyperparameters</h3>
              <p className="text-xs text-gray-400">Control vector search depth and chunk context window</p>
            </div>
          </div>

          {/* Top K slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-medium">Top-K Retrieved Chunks</span>
              <span className="font-mono text-blue-400 font-bold bg-[#141B2D] px-2 py-0.5 rounded border border-[#1E293B]">
                {topK} Chunks
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="w-full accent-blue-500 h-1.5 bg-[#1E293B] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>1 (Fastest)</span>
              <span>4 (Recommended)</span>
              <span>10 (Broad Context)</span>
            </div>
          </div>

          {/* Readonly Architecture Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E293B]">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Chunk Size & Overlap</span>
              <span className="text-xs font-mono text-gray-200 mt-1 block">
                {config?.chunk_size || 850} chars · {config?.chunk_overlap || 150} overlap
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E293B]">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Dense Vector Model</span>
              <span className="text-xs font-mono text-gray-200 mt-1 block">
                {config?.embedding_model || 'all-MiniLM-L6-v2'}
              </span>
            </div>
          </div>
        </div>

        {/* Strict Grounding Contract Card */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            Strict Grounding Contract
          </div>
          <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#1E293B] text-[11px] font-mono text-gray-400 leading-relaxed space-y-1">
            <p>• "Answer questions using ONLY the retrieved document context."</p>
            <p>• "Never invent SLA percentages, error-code thresholds, escalation times, or company policies."</p>
            <p>• "If not available: 'I could not find this information in the TitanCloud SRE Incident Runbook.'"</p>
            <p>• "Always cite source page numbers when available."</p>
            <p>• "For external queries (stock prices), state that runbook does not provide real-time financial data."</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
