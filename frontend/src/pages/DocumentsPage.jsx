import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  FileCheck2,
  Sparkles,
  Loader2,
  FileWarning
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentsPage({ onDocumentsChanged }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setActionError("Only PDF documents can be indexed.");
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    setUploading(true);
    setActionMessage(`Extracting pages and generating vector embeddings for ${file.name}...`);
    setActionError(null);

    try {
      await api.uploadDocument(file);
      setActionMessage(`Successfully ingested & indexed ${file.name}!`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadDocs();
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      setActionError(err.message || "Failed to upload document");
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleIndexDefault = async () => {
    setUploading(true);
    setActionMessage("Ingesting official 50-page TitanCloud SRE Incident Runbook into ChromaDB...");
    setActionError(null);

    try {
      await api.indexDefaultRunbook();
      setActionMessage("Successfully indexed official 50-page TitanCloud SRE Incident Runbook!");
      setTimeout(() => setActionMessage(null), 4000);
      await loadDocs();
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      setActionError(err.message || "Failed to index default runbook");
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename} and its vector embeddings?`)) {
      try {
        await api.deleteDocument(docId);
        setActionMessage(`Deleted ${filename} from database and vector index.`);
        setTimeout(() => setActionMessage(null), 3000);
        await loadDocs();
        if (onDocumentsChanged) onDocumentsChanged();
      } catch (err) {
        setActionError(err.message || "Failed to delete document");
        setTimeout(() => setActionError(null), 4000);
      }
    }
  };

  const handleReindex = async (docId, filename) => {
    setUploading(true);
    setActionMessage(`Re-extracting and re-indexing ${filename}...`);
    try {
      await api.reindexDocument(docId);
      setActionMessage(`Successfully re-indexed ${filename}!`);
      setTimeout(() => setActionMessage(null), 3000);
      await loadDocs();
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      setActionError(err.message || "Failed to reindex document");
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Upload Zone & Runbook Action Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Box */}
        <div className="md:col-span-2 bg-[#111827] rounded-xl border border-[#1E293B] p-6 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-white mb-1">Ingest SRE Runbook PDF</h3>
          <p className="text-xs text-gray-400 mb-4">
            Upload enterprise PDF documents. The system uses PyMuPDF to extract text, preserves 1-indexed page references, and splits content into vector chunks.
          </p>

          <label className="border-2 border-dashed border-[#1E293B] hover:border-blue-500/50 bg-[#0B0F19]/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <span className="text-xs text-gray-300 font-medium">Processing & Indexing PDF...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 flex items-center justify-center mb-3 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-200">
                  Click to browse or drop runbook PDF
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Supported formats: PDF (up to 50+ pages with technical schemas)
                </span>
              </div>
            )}
          </label>
        </div>

        {/* Quick Official Corpus Provisioning */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">Official 50-Page Corpus</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              The workspace contains the canonical 50-page technical incident runbook (<span className="text-gray-300 font-mono">data/titancloud_sre_incident_runbook_50p.pdf</span>).
            </p>
            <div className="mt-4 p-3 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-1.5 text-xs font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Page Count:</span>
                <span className="text-gray-200">50 Pages</span>
              </div>
              <div className="flex justify-between">
                <span>Modules:</span>
                <span className="text-gray-200">50 SRE Modules</span>
              </div>
              <div className="flex justify-between">
                <span>Key Coverage:</span>
                <span className="text-gray-200">SLAs, Patroni, PagerDuty</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleIndexDefault}
            disabled={uploading}
            className="mt-6 w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck2 className="w-4 h-4" />
            )}
            <span>Index 50-Page Runbook</span>
          </button>
        </div>
      </div>

      {/* Ingested Documents Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Indexed SRE Runbooks</h3>
            <p className="text-xs text-gray-400">Preserved original page numbers and ChromaDB vector embeddings</p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1E293B] px-2.5 py-1 rounded">
            Total Documents: {documents.length}
          </span>
        </div>

        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151E30] text-gray-400 uppercase tracking-wider font-medium border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Chroma Chunks</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Indexed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#141C2E] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-200">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {doc.page_count}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {doc.chunk_count}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      {formatBytes(doc.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.status === 'indexed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Indexed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono">
                      {new Date(doc.indexed_at * 1000).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReindex(doc.id, doc.filename)}
                          disabled={uploading}
                          className="p-1.5 rounded hover:bg-[#1E293B] text-gray-400 hover:text-blue-400 transition-colors"
                          title="Re-index document"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          disabled={uploading}
                          className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <FileWarning className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-300">No Runbooks Currently Indexed</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Index 50-Page Runbook" above or upload a PDF to populate ChromaDB.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
