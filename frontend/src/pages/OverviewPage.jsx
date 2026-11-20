import React from 'react';
import {
  FileText,
  Layers,
  Search,
  Clock,
  Database,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function OverviewPage({ stats, health, onNavigate }) {
  const metricCards = [
    {
      label: 'Uploaded Runbooks',
      value: stats?.total_documents || 0,
      subtext: `${stats?.total_indexed_pages || 0} pages indexed`,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Indexed Chunks',
      value: stats?.total_chunks || 0,
      subtext: 'Vector embeddings in ChromaDB',
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      label: 'Incident Queries',
      value: stats?.total_queries || 0,
      subtext: 'Processed through RAG pipeline',
      icon: Search,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'Avg Response Latency',
      value: stats?.avg_latency_ms ? `${stats.avg_latency_ms} ms` : '0 ms',
      subtext: 'Vector retrieval + grounded LLM',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
  ];

  // Chart data from recent queries or realistic baseline
  const chartData = (stats?.recent_queries || []).slice(0, 10).reverse().map((q, idx) => ({
    name: `Q${idx + 1}`,
    latency: q.latency_ms,
    chunks: q.chunks_retrieved
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#1E293B] bg-gradient-to-r from-[#111927] via-[#152136] to-[#0E1726] p-6 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SRE Command Center
              </span>
              <span className="text-xs text-gray-400 font-mono">Runbook Corpus: 50 Pages Active</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              TitanCloud Enterprise SRE Incident Runbook Assistant
            </h2>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Real-time vector search & strictly grounded AI assistance for cluster SLAs, PostgreSQL replica lag,
              PagerDuty escalation timelines, and root-cause remediation runbooks.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              Open AI Assistant
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('assessment')}
              className="px-4 py-2.5 rounded-lg bg-[#1E293B] hover:bg-[#2A374F] text-gray-200 text-xs font-semibold border border-gray-700/60 transition-all"
            >
              Run 5-Test Suite
            </button>
          </div>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 shadow-sm hover:border-[#2E3C56] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.borderColor} border`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">{card.value}</div>
              <p className="text-xs text-gray-400 mt-1">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Service Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vector DB Status Card */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Vector Database</div>
              <div className="text-sm font-semibold text-white">ChromaDB Persistent Store</div>
              <div className="text-xs text-gray-400 font-mono">
                Collection: titancloud_runbooks ({stats?.total_chunks || 0} vectors)
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {stats?.vector_db_status || 'Online'}
          </span>
        </div>

        {/* AI Model Status Card */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">AI Model Engine</div>
              <div className="text-sm font-semibold text-white">Google Gemini API (1.5 Flash)</div>
              <div className="text-xs text-gray-400 font-mono">
                Strict Grounding Enabled (Zero Hallucination)
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              health?.api_key_configured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${health?.api_key_configured ? 'bg-emerald-400' : 'bg-amber-400'}`}
            ></span>
            {health?.api_key_configured ? 'Connected' : 'Key Inactive'}
          </span>
        </div>
      </div>

      {/* Latency Chart & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Trend Chart */}
        <div className="lg:col-span-2 bg-[#111827] rounded-xl border border-[#1E293B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Query Latency Profile</h3>
              <p className="text-xs text-gray-400">Response time in milliseconds per RAG execution</p>
            </div>
            <span className="text-xs text-gray-400 font-mono bg-[#1E293B] px-2 py-0.5 rounded">
              Last {chartData.length} queries
            </span>
          </div>
          {chartData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#latencyGradient)"
                    name="Latency (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1E293B] rounded-lg">
              <Clock className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-400">No query data recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Ask a question in AI Assistant or run assessment tests to view live latency metrics.
              </p>
            </div>
          )}
        </div>

        {/* Recent Document Activity */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Document Activity</h3>
              <p className="text-xs text-gray-400">Ingested SRE runbooks</p>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              stats.recent_documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#141B2D] border border-[#1E293B] hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-200 line-clamp-1">
                          {doc.filename}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {doc.page_count} Pages · {doc.chunk_count} Chunks
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Indexed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#1E293B] rounded-lg">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-400">No documents indexed yet</p>
                <button
                  onClick={() => onNavigate('documents')}
                  className="mt-2 text-xs text-blue-400 hover:underline"
                >
                  Upload or Index Runbook
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Queries Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Incident Queries</h3>
            <p className="text-xs text-gray-400">Audit trail of natural language SRE investigations</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Audit Trail →
          </button>
        </div>

        {stats?.recent_queries && stats.recent_queries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151E30] text-gray-400 uppercase tracking-wider font-medium border-b border-[#1E293B]">
                <tr>
                  <th className="py-2.5 px-4">Query</th>
                  <th className="py-2.5 px-4">Grounding Status</th>
                  <th className="py-2.5 px-4">Chunks</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {stats.recent_queries.slice(0, 5).map((q, idx) => (
                  <tr key={idx} className="hover:bg-[#141C2E] transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-200 max-w-xs truncate">
                      {q.query}
                    </td>
                    <td className="py-3 px-4">
                      {q.grounded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Grounded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" /> External/Refusal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono">
                      {q.chunks_retrieved}
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono">
                      {q.latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono">
                      {new Date(q.created_at * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 border border-dashed border-[#1E293B] rounded-lg">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs">No queries logged yet. Use the AI Assistant to investigate runbook policies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
