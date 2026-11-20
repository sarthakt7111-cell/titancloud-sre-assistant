import React from 'react';
import { Search, Bell, Shield, Sparkles, Terminal, Cpu } from 'lucide-react';

export default function Header({ currentTab, setCurrentTab, health }) {
  const getTitle = () => {
    switch (currentTab) {
      case 'overview': return 'SRE Operations Overview';
      case 'assistant': return 'AI Incident Runbook Assistant';
      case 'documents': return 'Runbook Document Management';
      case 'assessment': return 'RAG Grounding & Compliance Assessment';
      case 'history': return 'Incident Query Audit Trail';
      case 'health': return 'Platform Services Health';
      case 'settings': return 'System Settings & API Keys';
      default: return 'TitanCloud SRE Assistant';
    }
  };

  return (
    <header className="h-16 bg-[#0D1322]/90 backdrop-blur border-b border-[#1E293B] px-6 flex items-center justify-between shrink-0 z-10">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white tracking-tight">{getTitle()}</h1>
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#1E293B] text-gray-400 border border-gray-700/50">
          <Terminal className="w-3 h-3 text-blue-400" />
          RAG Mode: Strict Grounding
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Model status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141B2D] border border-[#1E293B] text-xs">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-gray-400">Model:</span>
          <span className="font-mono text-gray-200">
            {health?.active_model || 'gemini-1.5-flash'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${health?.api_key_configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setCurrentTab('assessment')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-600/30"
        >
          <Shield className="w-3.5 h-3.5" />
          Run SLA Benchmark
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#1E293B]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xs font-semibold text-white shadow-inner">
            TC
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-gray-200 leading-none">On-Call SRE</div>
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">Tier-3 Command</div>
          </div>
        </div>
      </div>
    </header>
  );
}
