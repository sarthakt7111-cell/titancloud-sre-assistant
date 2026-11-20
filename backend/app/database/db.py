import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

def get_db_connection():
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        page_count INTEGER NOT NULL,
        chunk_count INTEGER NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        indexed_at REAL NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT
    )
    """)
    
    # Conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    )
    """)
    
    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations_json TEXT,
        latency_ms REAL,
        created_at REAL NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
    """)
    
    # Query history/analytics table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS query_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        answer TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        chunks_retrieved INTEGER NOT NULL,
        grounded INTEGER NOT NULL,
        created_at REAL NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

# Document Operations
def save_document_record(doc: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO documents 
        (id, filename, filepath, page_count, chunk_count, file_size_bytes, indexed_at, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc["id"], doc["filename"], doc["filepath"], doc["page_count"],
        doc["chunk_count"], doc["file_size_bytes"], doc.get("indexed_at", time.time()),
        doc["status"], doc.get("error_message")
    ))
    conn.commit()
    conn.close()

def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY indexed_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_document_record(doc_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

# Chat & Message Operations
def create_conversation(conv_id: str, title: str = "New Investigation") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute("""
        INSERT OR REPLACE INTO conversations (id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?)
    """, (conv_id, title, now, now))
    conn.commit()
    conn.close()
    return {"id": conv_id, "title": title, "created_at": now, "updated_at": now}

def get_conversations() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_message(msg_id: str, conv_id: str, role: str, content: str, citations: Optional[List[Dict[str, Any]]] = None, latency_ms: Optional[float] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    citations_json = json.dumps(citations) if citations else None
    cursor.execute("""
        INSERT INTO messages (id, conversation_id, role, content, citations_json, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (msg_id, conv_id, role, content, citations_json, latency_ms, now))
    cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conv_id))
    conn.commit()
    conn.close()

def get_messages(conv_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conv_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        if d.get("citations_json"):
            try:
                d["citations"] = json.loads(d["citations_json"])
            except Exception:
                d["citations"] = []
        else:
            d["citations"] = []
        result.append(d)
    return result

def clear_all_chats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages")
    cursor.execute("DELETE FROM conversations")
    conn.commit()
    conn.close()

# Analytics Operations
def log_query(query: str, answer: str, latency_ms: float, chunks_retrieved: int, grounded: bool):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO query_logs (query, answer, latency_ms, chunks_retrieved, grounded, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (query, answer, latency_ms, chunks_retrieved, 1 if grounded else 0, time.time()))
    conn.commit()
    conn.close()

def get_stats_data() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Doc counts and indexed pages
    cursor.execute("SELECT COUNT(*), COALESCE(SUM(page_count), 0), COALESCE(SUM(chunk_count), 0) FROM documents WHERE status = 'indexed'")
    doc_count, total_pages, total_chunks = cursor.fetchone()
    
    # Query stats
    cursor.execute("SELECT COUNT(*), COALESCE(AVG(latency_ms), 0) FROM query_logs")
    query_count, avg_latency = cursor.fetchone()
    
    # Recent queries
    cursor.execute("SELECT query, answer, latency_ms, chunks_retrieved, grounded, created_at FROM query_logs ORDER BY created_at DESC LIMIT 10")
    recent_queries = [dict(row) for row in cursor.fetchall()]
    
    # Recent docs
    cursor.execute("SELECT filename, page_count, chunk_count, status, indexed_at FROM documents ORDER BY indexed_at DESC LIMIT 5")
    recent_docs = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return {
        "total_documents": doc_count,
        "total_indexed_pages": total_pages,
        "total_chunks": total_chunks,
        "total_queries": query_count,
        "avg_latency_ms": round(avg_latency, 2),
        "recent_queries": recent_queries,
        "recent_documents": recent_docs
    }
