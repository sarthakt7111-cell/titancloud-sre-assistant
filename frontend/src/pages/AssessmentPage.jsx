import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  ExternalLink,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function AssessmentPage({ onQueryLogged }) {
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const predefinedTests = [
    {
      id: "Q1",
      question: "What exact service-credit percentage is owed to enterprise customers if monthly cluster uptime falls to 99.2%?",
      expectedFocus: "25% SLA Service Credit (Clause 2.3, Page 9)",
      category: "SLA / Service Credits"
    },
    {
      id: "Q2",
      question: "When error code ERR_PG_REPLICA_LAG is triggered, what is the maximum replication-lag threshold, in seconds, before automatic failover begins?",
      expectedFocus: "45 Seconds Automatic Failover Threshold (Clause 5.4, Page 22)",
      category: "Patroni High-Availability"
    },
    {
      id: "Q3",
      question: "What is TitanCloud's current stock ticker price on the NASDAQ exchange?",
      expectedFocus: "External Financial Refusal (No Hallucinated Stock Price)",
      category: "Safety Guardrails / External Data"
    },
    {
      id: "Q4",
      question: "How many minutes does the L1 On-Call Engineer have to acknowledge a Severity-1 (P0) alert before it is escalated to the VP of Infrastructure?",
      expectedFocus: "5 Minutes Acknowledge / 15 Minutes to VP (Clause 9.1, Page 41)",
      category: "PagerDuty Incident Escalation"
    },
    {
      id: "Q5",
      question: "What is the approved procedure for replacing a cracked screen on a company-issued iPhone 15?",
      expectedFocus: "Missing Information Acknowledgment (Not in technical SRE runbook)",
      category: "Grounding / Domain Boundary"
    }
  ];

  const handleRunAssessment = async () => {
    setLoading(true);
    try {
      const data = await api.runAssessment();
      setAssessmentData(data);
      if (onQueryLogged) onQueryLogged();
    } catch (err) {
      alert(`Error running assessment: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (res) => {
    switch (res.grounding_status) {
      case "VERIFIED_RUNBOOK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Runbook Grounding
          </span>
        );
      case "EXTERNAL_DECLINED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> External Query Blocked
          </span>
        );
      case "NOT_FOUND_ACKNOWLEDGED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Out-of-Corpus Refusal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Ungrounded / Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Header Banner */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Evaluation Suite
              </span>
              <span className="text-xs text-gray-400 font-mono">5 SRE Benchmark Prompts</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              TitanCloud SRE RAG Grounding & Compliance Assessment
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Validates that the RAG pipeline grounds numerical SLAs, error code failover thresholds, and on-call escalation matrices strictly in the 50-page runbook while blocking external financial hallucinations (Q3) and out-of-scope IT hardware requests (Q5).
            </p>
          </div>

          <button
            onClick={handleRunAssessment}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-400 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing 5 Tests in RAG Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Full Assessment Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Scorecard (when tests have run) */}
      {assessmentData && (
        <div className="bg-gradient-to-r from-[#121A2B] via-[#16233B] to-[#121A2B] rounded-xl border border-blue-500/30 p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Assessment Results Summary
              </span>
              <div className="text-2xl font-bold text-white font-mono flex items-center gap-3">
                <span>{assessmentData.passed_tests} / {assessmentData.total_tests} Tests Passed</span>
                <span className="text-emerald-400 text-lg">({assessmentData.success_rate}%)</span>
              </div>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                {assessmentData.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 font-mono text-xs">
              <div className="bg-[#0B0F19]/80 border border-[#1E293B] rounded-lg p-3 text-center">
                <div className="text-gray-400 text-[10px] uppercase">Passed</div>
                <div className="text-emerald-400 font-bold text-lg">{assessmentData.passed_tests}</div>
              </div>
              <div className="bg-[#0B0F19]/80 border border-[#1E293B] rounded-lg p-3 text-center">
                <div className="text-gray-400 text-[10px] uppercase">Failed</div>
                <div className="text-red-400 font-bold text-lg">{assessmentData.failed_tests}</div>
              </div>
              <div className="bg-[#0B0F19]/80 border border-[#1E293B] rounded-lg p-3 text-center col-span-2 sm:col-span-1">
                <div className="text-gray-400 text-[10px] uppercase">Compliance</div>
                <div className="text-blue-400 font-bold text-lg">100% Strict</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases Grid */}
      <div className="space-y-4">
        {predefinedTests.map((test, index) => {
          const result = assessmentData?.results?.find((r) => r.id === test.id);
          const isExpanded = expandedId === test.id || !assessmentData;

          return (
            <div
              key={test.id}
              className={`rounded-xl border transition-all ${
                result
                  ? result.passed
                    ? 'bg-[#111827] border-emerald-500/30'
                    : 'bg-[#111827] border-red-500/30'
                  : 'bg-[#111827] border-[#1E293B]'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedId(expandedId === test.id ? null : test.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#141C2E] rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-blue-400 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {test.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-gray-400 bg-[#162032] px-2 py-0.5 rounded border border-[#1E293B]">
                        {test.category}
                      </span>
                      {result && getStatusBadge(result)}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {test.question}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {result && (
                    <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.latency_ms} ms
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {isExpanded ? 'Hide' : 'Inspect'}
                  </span>
                </div>
              </div>

              {/* Expanded Details / Actual RAG Execution Output */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-[#1E293B]/60 space-y-4 text-xs">
                  {/* Expected Verification Objective */}
                  <div className="p-3 rounded-lg bg-[#0E1524] border border-[#1E293B] text-gray-300">
                    <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                      Expected Benchmark Grounding Target:
                    </span>
                    <span className="font-mono text-blue-300">{test.expectedFocus}</span>
                  </div>

                  {result ? (
                    <>
                      {/* Generated Answer */}
                      <div>
                        <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block mb-1.5">
                          Generated RAG Answer:
                        </span>
                        <div className="p-4 rounded-lg bg-[#151E30] border border-[#1E293B] text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                          {result.answer}
                        </div>
                      </div>

                      {/* Source Citations & Pages */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E293B]">
                          <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                            Retrieved Source Pages:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {result.source_pages && result.source_pages.length > 0 ? (
                              result.source_pages.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs font-semibold"
                                >
                                  Page {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 font-mono">None (Refusal/Unverified)</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E293B]">
                          <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                            Grounding Status:
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {result.grounding_status}
                          </span>
                        </div>
                      </div>

                      {/* Retrieved Chunks Evidence */}
                      {result.citations && result.citations.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider block mb-1.5">
                            Retrieved Runbook Evidence Chunks ({result.citations.length}):
                          </span>
                          <div className="space-y-2">
                            {result.citations.map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B] text-gray-300 font-mono text-[11px] leading-relaxed"
                              >
                                <div className="flex items-center justify-between text-gray-400 mb-1 pb-1 border-b border-[#1E293B]">
                                  <span>Page {c.page_number}</span>
                                  {c.relevance_score && (
                                    <span>Cosine Relevance: {Math.round(c.relevance_score * 100)}%</span>
                                  )}
                                </div>
                                <div className="whitespace-pre-wrap">{c.text_snippet}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-[#0E1524] border border-dashed border-[#1E293B] text-center text-gray-400">
                      Click <strong className="text-blue-400">"Run Full Assessment Suite"</strong> to execute this query through the live vector retrieval & Gemini RAG pipeline.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
