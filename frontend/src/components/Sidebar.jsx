import React from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  ShieldCheck,
  History,
  Activity,
  Settings,
  Server,
  CloudLightning,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, stats, health }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'RAG' },
    { id: 'documents', label: 'Documents', icon: FileText, badge: stats?.total_documents ? `${stats.total_documents}` : null },
    { id: 'assessment', label: 'Assessment Tests', icon: ShieldCheck, badge: '5 Tests' },
    { id: 'history', label: 'Query History', icon: History },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0D1322] border-r border-[#1E293B] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#1E293B] gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-900/30">
          <CloudLightning className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">TitanCloud</span>
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
              SRE
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">Incident Runbook RAG</p>
        </div>
      </div>

      {/* Cluster/Environment Status Pill */}
      <div className="px-4 py-3 border-b border-[#1E293B]/60 bg-[#0B0F19]/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-gray-300 font-medium">Core Cluster</span>
          </div>
          <span className="font-mono text-[11px] text-gray-400 bg-[#151D2E] px-2 py-0.5 rounded border border-[#1E293B]">
            us-east-1
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-[#151D2E] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-[#1E293B] text-gray-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer System Telemetry */}
      <div className="p-4 border-t border-[#1E293B] bg-[#0A0E17]/60">
        <div className="bg-[#121927] rounded-lg p-3 border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              ChromaDB
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-medium">
              {stats?.total_chunks || 0} chunks
            </span>
          </div>
          <div className="w-full bg-[#1A2333] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((stats?.total_indexed_pages || 0) / 50) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400 font-mono">
            <span>Pages Indexed</span>
            <span>{stats?.total_indexed_pages || 0} / 50</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
