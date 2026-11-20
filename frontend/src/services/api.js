const API_BASE = '/api';

export const api = {
  // Stats & Health
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  // Documents
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async indexDefaultRunbook() {
    const res = await fetch(`${API_BASE}/documents/index-default`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to index default runbook');
    }
    return res.json();
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async reindexDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/reindex`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reindex document');
    return res.json();
  },

  // Chat
  async sendChatMessage(message, conversationId = null, topK = 4) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        top_k: topK,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  async getChatHistory(conversationId = null) {
    const url = conversationId
      ? `${API_BASE}/chat/history?conversation_id=${encodeURIComponent(conversationId)}`
      : `${API_BASE}/chat/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async clearChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear chat history');
    return res.json();
  },

  // Assessment
  async runAssessment() {
    const res = await fetch(`${API_BASE}/assessment/run`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run assessment');
    return res.json();
  },

  // Config
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
  },

  async updateConfig(cfg) {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },
};
