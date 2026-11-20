import React from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function HealthPage({ health, onRefresh }) {
  const services = [
    {
      name: 'FastAPI Backend Server',
      status: health?.fastapi_status === 'running' ? 'OPERATIONAL' : 'OFFLINE',
      isHealthy: health?.fastapi_status === 'running',
      details: 'REST API, CORS middleware, lifespan lifecycle',
      version: '0.110.0',
      icon: Server,
      color: 'text-blue-400'
    },
    {
      name: 'Google Gemini API',
      status: health?.api_key_configured ? 'CONNECTED' : 'KEY REQUIRED',
      isHealthy: health?.api_key_configured,
      details: `Active model: ${health?.active_model || 'gemini-1.5-flash'}`,
      version: 'v1.5 Flash',
      icon: Cpu,
      color: 'text-indigo-400'
    },
    {
      name: 'ChromaDB Vector Database',
      status: health?.chromadb_status === 'connected' ? 'ONLINE' : 'DEGRADED',
      isHealthy: health?.chromadb_status === 'connected',
      details: `Persisted at ./chroma_db · ${health?.total_chunks || 0} vectors`,
      version: 'v0.4.x',
      icon: Database,
      color: 'text-emerald-400'
    },
    {
      name: 'Sentence Transformers',
      status: health?.embedding_model_status === 'active' ? 'ACTIVE' : 'OFFLINE',
      isHealthy: health?.embedding_model_status === 'active',
      details: 'all-MiniLM-L6-v2 (384-dimensional dense vectors)',
      version: 'v2.5.1',
      icon: Layers,
      color: 'text-cyan-400'
    },
    {
      name: 'SQLite Operational Database',
      status: health?.database_status === 'connected' ? 'CONNECTED' : 'DISCONNECTED',
      isHealthy: health?.database_status === 'connected',
      details: 'Stores document records, audit trails, and conversations',
      version: 'SQLite 3',
      icon: Activity,
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              System Telemetry
            </span>
          </div>
          <h2 className="text-base font-bold text-white">Platform Services Health</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time status of FastAPI endpoints, vector database, Gemini connection, and embedding pipelines.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg bg-[#141B2D] hover:bg-[#1E293B] text-gray-200 text-xs font-medium border border-[#1E293B] transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc, idx) => {
          const Icon = svc.icon;
          return (
            <div
              key={idx}
              className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 flex flex-col justify-between hover:border-[#2E3C56] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E293B]">
                    <Icon className={`w-5 h-5 ${svc.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{svc.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{svc.details}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    svc.isHealthy
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${svc.isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  ></span>
                  {svc.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B]/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>Version / Architecture</span>
                <span className="text-gray-300">{svc.version}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
