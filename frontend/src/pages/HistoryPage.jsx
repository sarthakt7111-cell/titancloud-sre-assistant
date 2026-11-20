import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Trash2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage({ stats, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrounded, setFilterGrounded] = useState('all'); // all, grounded, external

  const queries = (stats?.recent_queries || []).filter((q) => {
    const matchesSearch = q.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.answer.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterGrounded === 'grounded') return matchesSearch && q.grounded;
    if (filterGrounded === 'external') return matchesSearch && !q.grounded;
    return matchesSearch;
  });

  const handleClear = async () => {
    if (window.confirm("Clear all incident query history logs?")) {
      await api.clearChatHistory();
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Incident Query Audit Trail</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Complete chronological record of SRE natural-language queries, citations, and grounding compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search query text or answers..."
            className="w-full bg-[#141B2D] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <select
            value={filterGrounded}
            onChange={(e) => setFilterGrounded(e.target.value)}
            className="bg-[#141B2D] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none"
          >
            <option value="all">All Queries</option>
            <option value="grounded">Verified Grounded</option>
            <option value="external">External / Refusals</option>
          </select>
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden shadow-sm">
        {queries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151E30] text-gray-400 uppercase tracking-wider font-medium border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">User Query</th>
                  <th className="py-3 px-4">Grounding Status</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {queries.map((q, idx) => (
                  <tr key={idx} className="hover:bg-[#141C2E] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-200 max-w-md">
                      <div>{q.query}</div>
                      <div className="text-[11px] text-gray-400 font-sans mt-1 line-clamp-2">
                        {q.answer}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-gray-300 font-mono">
                      {q.chunks_retrieved}
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-mono">
                      {q.latency_ms} ms
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono">
                      {new Date(q.created_at * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs">No matching query records found in the audit trail.</p>
          </div>
        )}
      </div>
    </div>
  );
}
