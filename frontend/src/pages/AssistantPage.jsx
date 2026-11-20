import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

export default function AssistantPage({ onQueryLogged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeCitationChunk, setActiveCitationChunk] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What happens if monthly cluster uptime falls to 99.2%?",
    "When ERR_PG_REPLICA_LAG triggers, what is the maximum replication-lag threshold before automatic failover?",
    "How many minutes does the L1 engineer have to acknowledge a P0 alert before escalation to VP of Infrastructure?",
    "What is TitanCloud's current stock ticker price on the NASDAQ exchange?",
    "What is the procedure for replacing a company-issued iPhone 15 screen?"
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      const data = await api.getChatHistory();
      if (data.conversations && data.conversations.length > 0) {
        setConversationId(data.active_conversation_id);
        setMessages(data.messages || []);
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I am TitanCloud's Enterprise SRE Incident Runbook Assistant.\n\nI answer technical questions regarding cluster SLAs, Patroni failover thresholds, PagerDuty alert escalation matrices, and root-cause remediation runbooks.\n\nAll answers are strictly grounded in the official 50-page TitanCloud technical runbook with verified source page citations.",
            citations: [],
            created_at: Date.now() / 1000
          }
        ]);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    setInput('');
    const userMsgId = `user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: q,
      created_at: Date.now() / 1000
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await api.sendChatMessage(q, conversationId, 4);
      setConversationId(resp.conversation_id);
      
      const assistantMsg = {
        id: resp.message_id,
        role: 'assistant',
        content: resp.content,
        citations: resp.citations || [],
        latency_ms: resp.latency_ms,
        model_used: resp.model_used,
        is_grounded: resp.is_grounded,
        created_at: Date.now() / 1000
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (onQueryLogged) onQueryLogged();
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error communicating with SRE Assistant: ${err.message || 'Unknown error'}. Please check if the backend server is running.`,
        isError: true,
        created_at: Date.now() / 1000
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear conversation history?")) {
      try {
        await api.clearChatHistory();
        setMessages([
          {
            id: 'welcome_reset',
            role: 'assistant',
            content: "Conversation history cleared. Ready for a new SRE incident inquiry.",
            citations: [],
            created_at: Date.now() / 1000
          }
        ]);
        setConversationId(null);
        if (onQueryLogged) onQueryLogged();
      } catch (err) {
        console.error("Error clearing chat:", err);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col bg-[#111827] rounded-xl border border-[#1E293B] shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3 border-b border-[#1E293B] bg-[#0E1524] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">SRE Runbook Investigation</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Strict Grounding Active · 50-Page Corpus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E293B] text-blue-400 border border-[#2E3C56]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-xl p-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-[#151E30] text-gray-200 border border-[#1E293B] rounded-tl-none'
                  }`}
                >
                  {/* Content */}
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Citations & Metadata (for Assistant) */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1E293B]">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        Grounded Source Citations ({msg.citations.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitationChunk(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F172A] hover:bg-[#1E293B] border border-blue-500/30 text-blue-300 text-xs font-mono transition-colors"
                          >
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span>Page {c.page_number}</span>
                            {c.relevance_score && (
                              <span className="text-[10px] text-gray-400">
                                ({Math.round(c.relevance_score * 100)}% match)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with Copy & Latency */}
                  {!isUser && (
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#1E293B]/60">
                      <div className="flex items-center gap-2">
                        {msg.model_used && (
                          <span className="font-mono bg-[#0F172A] px-1.5 py-0.5 rounded text-gray-400 border border-[#1E293B]">
                            {msg.model_used}
                          </span>
                        )}
                        {msg.latency_ms && (
                          <span className="font-mono">{msg.latency_ms} ms</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-blue-400 border border-[#2E3C56] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#151E30] rounded-xl rounded-tl-none p-4 border border-[#1E293B] flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-gray-300">
                  Retrieving runbook vectors and strictly grounding answer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-5 py-2.5 bg-[#0E1524] border-t border-[#1E293B] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              disabled={loading}
              className="text-xs bg-[#162032] hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-[#1E293B] hover:border-blue-500/30 px-3 py-1.5 rounded-full transition-all shrink-0"
            >
              {sq.length > 55 ? sq.substring(0, 55) + '...' : sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0D1322] border-t border-[#1E293B]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an incident runbook question (e.g. cluster SLA credits, replication lag, P0 alerts)..."
              disabled={loading}
              className="flex-1 bg-[#141B2D] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Context Citation Inspector */}
      {activeCitationChunk && (
        <div className="w-80 bg-[#111827] rounded-xl border border-[#1E293B] shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-[#1E293B] bg-[#0E1524] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">Source Chunk Inspector</span>
            </div>
            <button
              onClick={() => setActiveCitationChunk(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Document
              </span>
              <p className="text-xs font-semibold text-gray-200 mt-0.5">
                {activeCitationChunk.document_name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#151E30] p-2.5 rounded-lg border border-[#1E293B]">
                <div className="text-[10px] text-gray-400 uppercase">Page Number</div>
                <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
                  Page {activeCitationChunk.page_number}
                </div>
              </div>
              <div className="bg-[#151E30] p-2.5 rounded-lg border border-[#1E293B]">
                <div className="text-[10px] text-gray-400 uppercase">Relevance Score</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  {Math.round((activeCitationChunk.relevance_score || 0) * 100)}%
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Extracted Text Snippet
              </span>
              <div className="mt-1.5 p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B] text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {activeCitationChunk.text_snippet || activeCitationChunk.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
