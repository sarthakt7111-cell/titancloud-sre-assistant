import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database.db import init_db, get_all_documents
from backend.app.api.routes import router as api_router, index_default_runbook
from backend.app.services.vector_service import get_vector_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("titancloud")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing TitanCloud SRE Assistant backend...")
    
    # 1. Initialize SQLite Database
    init_db()
    logger.info("Database initialized.")
    
    # 2. Initialize Chroma Vector Service
    vector_svc = get_vector_service()
    logger.info(f"Vector DB ready. Existing chunk count: {vector_svc.count()}")
    
    # 3. Auto-index default runbook if available and not yet indexed
    default_pdf = os.path.join(settings.DATA_DIR, "titancloud_sre_incident_runbook_50p.pdf")
    if os.path.exists(default_pdf):
        docs = get_all_documents()
        already_indexed = any(d["filename"] == "titancloud_sre_incident_runbook_50p.pdf" and d["status"] == "indexed" for d in docs)
        if not already_indexed or vector_svc.count() == 0:
            logger.info("Auto-indexing default 50-page TitanCloud SRE Incident Runbook...")
            try:
                index_default_runbook()
                logger.info(f"Auto-indexed default runbook successfully! Total chunks: {vector_svc.count()}")
            except Exception as e:
                logger.error(f"Error auto-indexing default runbook: {e}")
        else:
            logger.info("Default runbook already indexed.")
            
    yield
    logger.info("TitanCloud SRE Assistant backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Cloud SRE & Incident Runbook Assistant with Strict RAG Grounding",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
