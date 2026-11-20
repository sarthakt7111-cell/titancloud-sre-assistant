import os
import shutil
import uuid
import time
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, BackgroundTasks
from backend.app.core.config import settings
from backend.app.models.schemas import (
    ChatRequest, ChatResponse, DocumentItem, DocumentListResponse,
    AssessmentResponse, SystemHealth, OverviewStats, ConfigUpdateRequest
)
from backend.app.services.pdf_service import PDFService
from backend.app.services.vector_service import get_vector_service
from backend.app.services.gemini_service import get_gemini_service
from backend.app.rag.pipeline import get_rag_pipeline
from backend.app.database.db import (
    save_document_record, get_all_documents, get_document_by_id,
    delete_document_record, get_conversations, get_messages, clear_all_chats,
    get_stats_data
)

router = APIRouter()

@router.get("/health", response_model=SystemHealth)
def get_system_health():
    vector_svc = get_vector_service()
    gemini_svc = get_gemini_service()
    
    vec_health = vector_svc.get_health()
    gem_health = gemini_svc.get_status()
    
    all_docs = get_all_documents()
    total_docs = len(all_docs)
    total_chunks = vector_svc.count()
    
    overall_status = "healthy" if vec_health.get("status") == "connected" else "degraded"
    
    return SystemHealth(
        status=overall_status,
        fastapi_status="running",
        gemini_api_status=gem_health.get("status", "unknown"),
        chromadb_status=vec_health.get("status", "unknown"),
        embedding_model_status="active",
        total_documents=total_docs,
        total_chunks=total_chunks,
        database_status="connected",
        api_key_configured=bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here"),
        active_model=gem_health.get("model", "gemini-1.5-flash")
    )

@router.get("/stats", response_model=OverviewStats)
def get_overview_stats():
    raw_stats = get_stats_data()
    vector_svc = get_vector_service()
    gemini_svc = get_gemini_service()
    
    gem_status = gemini_svc.get_status()
    vec_status = vector_svc.get_health()
    
    return OverviewStats(
        total_documents=raw_stats["total_documents"],
        total_indexed_pages=raw_stats["total_indexed_pages"],
        total_chunks=raw_stats["total_chunks"],
        total_queries=raw_stats["total_queries"],
        avg_latency_ms=raw_stats["avg_latency_ms"],
        vector_db_status="Online" if vec_status.get("status") == "connected" else "Offline",
        ai_model_status="Connected" if gem_status.get("status") == "connected" else (
            "API Key Required" if gem_status.get("status") == "not_configured" else "Offline"
        ),
        recent_queries=raw_stats["recent_queries"],
        recent_documents=raw_stats["recent_documents"]
    )

@router.get("/documents", response_model=DocumentListResponse)
def list_documents():
    docs = get_all_documents()
    total_pages = sum(d.get("page_count", 0) for d in docs)
    return DocumentListResponse(
        documents=[DocumentItem(**d) for d in docs],
        total_documents=len(docs),
        total_pages=total_pages
    )

@router.post("/documents/upload", response_model=DocumentItem)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    saved_path = os.path.join(settings.DATA_DIR, file.filename)
    
    # Check for existing document with same filename
    existing_docs = get_all_documents()
    for d in existing_docs:
        if d["filename"] == file.filename:
            # Prevent duplicate indexing unless deleted or reindexed
            return DocumentItem(**d)
            
    # Save file
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(saved_path)
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    
    try:
        # Extract pages with PyMuPDF
        pages_content = PDFService.extract_text_with_pages(saved_path)
        page_count = len(pages_content)
        
        # Chunk text preserving page numbers
        chunks = PDFService.chunk_document(pages_content, doc_id, file.filename)
        chunk_count = len(chunks)
        
        # Index in ChromaDB
        vector_svc = get_vector_service()
        vector_svc.add_chunks(chunks)
        
        doc_record = {
            "id": doc_id,
            "filename": file.filename,
            "filepath": saved_path,
            "page_count": page_count,
            "chunk_count": chunk_count,
            "file_size_bytes": file_size,
            "indexed_at": time.time(),
            "status": "indexed",
            "error_message": None
        }
        save_document_record(doc_record)
        return DocumentItem(**doc_record)
        
    except Exception as e:
        error_record = {
            "id": doc_id,
            "filename": file.filename,
            "filepath": saved_path,
            "page_count": 0,
            "chunk_count": 0,
            "file_size_bytes": file_size,
            "indexed_at": time.time(),
            "status": "failed",
            "error_message": str(e)
        }
        save_document_record(error_record)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.post("/documents/index-default", response_model=DocumentItem)
def index_default_runbook():
    """
    Indexes the default 50-page TitanCloud SRE runbook found in data/
    """
    default_filename = "titancloud_sre_incident_runbook_50p.pdf"
    filepath = os.path.join(settings.DATA_DIR, default_filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Default runbook file not found at {filepath}")
        
    # Check if already indexed
    existing_docs = get_all_documents()
    for d in existing_docs:
        if d["filename"] == default_filename and d["status"] == "indexed":
            return DocumentItem(**d)
            
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    file_size = os.path.getsize(filepath)
    
    pages_content = PDFService.extract_text_with_pages(filepath)
    page_count = len(pages_content)
    chunks = PDFService.chunk_document(pages_content, doc_id, default_filename)
    
    vector_svc = get_vector_service()
    vector_svc.add_chunks(chunks)
    
    doc_record = {
        "id": doc_id,
        "filename": default_filename,
        "filepath": filepath,
        "page_count": page_count,
        "chunk_count": len(chunks),
        "file_size_bytes": file_size,
        "indexed_at": time.time(),
        "status": "indexed",
        "error_message": None
    }
    save_document_record(doc_record)
    return DocumentItem(**doc_record)

@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from ChromaDB
    vector_svc = get_vector_service()
    vector_svc.delete_document(document_id)
    
    # Remove from SQLite
    delete_document_record(document_id)
    
    return {"status": "success", "message": f"Document {document_id} deleted."}

@router.post("/documents/{document_id}/reindex", response_model=DocumentItem)
def reindex_document(document_id: str):
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    filepath = doc["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Underlying PDF file missing from disk.")
        
    vector_svc = get_vector_service()
    # Delete old chunks
    vector_svc.delete_document(document_id)
    
    # Re-extract and re-chunk
    pages_content = PDFService.extract_text_with_pages(filepath)
    chunks = PDFService.chunk_document(pages_content, document_id, doc["filename"])
    
    # Re-add to ChromaDB
    vector_svc.add_chunks(chunks)
    
    doc["page_count"] = len(pages_content)
    doc["chunk_count"] = len(chunks)
    doc["indexed_at"] = time.time()
    doc["status"] = "indexed"
    doc["error_message"] = None
    save_document_record(doc)
    
    return DocumentItem(**doc)

@router.post("/chat", response_model=ChatResponse)
def chat_with_runbook(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    pipeline = get_rag_pipeline()
    response = pipeline.process_query(
        query=req.message,
        conversation_id=req.conversation_id,
        top_k=req.top_k or 4
    )
    return response

@router.get("/chat/history")
def get_chat_history(conversation_id: Optional[str] = None):
    conversations = get_conversations()
    messages = []
    active_conv_id = conversation_id
    if not active_conv_id and conversations:
        active_conv_id = conversations[0]["id"]
        
    if active_conv_id:
        messages = get_messages(active_conv_id)
        
    return {
        "conversations": conversations,
        "active_conversation_id": active_conv_id,
        "messages": messages
    }

@router.delete("/chat/history")
def clear_history():
    clear_all_chats()
    return {"status": "success", "message": "All chat history cleared."}

@router.post("/assessment/run", response_model=AssessmentResponse)
def run_assessment_tests():
    pipeline = get_rag_pipeline()
    return pipeline.run_assessment()

@router.get("/config")
def get_app_config():
    key = settings.GEMINI_API_KEY
    masked_key = ""
    if key and key != "your_gemini_api_key_here":
        masked_key = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
        
    return {
        "gemini_api_key_configured": bool(key and key != "your_gemini_api_key_here"),
        "gemini_api_key_masked": masked_key,
        "rag_top_k": settings.RAG_TOP_K,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "chroma_dir": settings.PERSIST_DIR
    }

@router.post("/config")
def update_app_config(cfg: ConfigUpdateRequest):
    if cfg.gemini_api_key is not None:
        settings.set_gemini_api_key(cfg.gemini_api_key)
        # Re-trigger gemini client configure
        get_gemini_service()._configure_client()
        
    if cfg.rag_top_k is not None:
        settings.RAG_TOP_K = cfg.rag_top_k
    if cfg.chunk_size is not None:
        settings.CHUNK_SIZE = cfg.chunk_size
    if cfg.chunk_overlap is not None:
        settings.CHUNK_OVERLAP = cfg.chunk_overlap
        
    return {"status": "success", "message": "Configuration updated successfully."}
