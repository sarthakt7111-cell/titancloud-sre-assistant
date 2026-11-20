from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Citation(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    chunk_index: int
    text_snippet: str
    relevance_score: Optional[float] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    top_k: Optional[int] = 4
    include_citations: Optional[bool] = True

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    citations: List[Citation] = []
    latency_ms: float
    model_used: str
    is_grounded: bool

class DocumentItem(BaseModel):
    id: str
    filename: str
    filepath: str
    page_count: int
    chunk_count: int
    file_size_bytes: int
    indexed_at: float
    status: str
    error_message: Optional[str] = None

class DocumentListResponse(BaseModel):
    documents: List[DocumentItem]
    total_documents: int
    total_pages: int

class AssessmentQuestionResult(BaseModel):
    id: str
    question: str
    expected_focus: str
    answer: str
    source_pages: List[int]
    evidence_retrieved: bool
    grounding_status: str  # "VERIFIED_RUNBOOK" | "EXTERNAL_DECLINED" | "NOT_FOUND_ACKNOWLEDGED" | "UNGROUNDED"
    passed: bool
    citations: List[Citation]
    latency_ms: float

class AssessmentResponse(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    success_rate: float
    results: List[AssessmentQuestionResult]
    summary: str

class SystemHealth(BaseModel):
    status: str
    fastapi_status: str
    gemini_api_status: str
    chromadb_status: str
    embedding_model_status: str
    total_documents: int
    total_chunks: int
    database_status: str
    api_key_configured: bool
    active_model: str

class OverviewStats(BaseModel):
    total_documents: int
    total_indexed_pages: int
    total_chunks: int
    total_queries: int
    avg_latency_ms: float
    vector_db_status: str
    ai_model_status: str
    recent_queries: List[Dict[str, Any]]
    recent_documents: List[Dict[str, Any]]

class ConfigUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    rag_top_k: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
