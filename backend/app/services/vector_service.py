import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    _instance = None
    
    def __init__(self):
        self.persist_dir = settings.PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        
        # Initialize embedding function
        self.embedding_function = self._init_embedding_function()
        
        # Initialize persistent Chroma client
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection_name = "titancloud_runbooks"
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"VectorService initialized. Collection items: {self.collection.count()}")

    def _init_embedding_function(self):
        """
        Initializes the embedding model.
        Uses SentenceTransformerEmbeddingFunction with fallback to DefaultEmbeddingFunction.
        """
        try:
            from chromadb.utils import embedding_functions
            logger.info(f"Loading SentenceTransformer: {settings.EMBEDDING_MODEL_NAME}")
            return embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=settings.EMBEDDING_MODEL_NAME
            )
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Falling back to Chroma DefaultEmbeddingFunction.")
            try:
                from chromadb.utils import embedding_functions
                return embedding_functions.DefaultEmbeddingFunction()
            except Exception as e2:
                logger.error(f"Fallback embedding function also failed: {e2}")
                return None

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Adds text chunks with metadata into ChromaDB.
        """
        if not chunks:
            return
            
        ids = [chunk["id"] for chunk in chunks]
        documents = [chunk["text"] for chunk in chunks]
        metadatas = [{
            "document_id": chunk["document_id"],
            "document_name": chunk["document_name"],
            "page_number": int(chunk["page_number"]),
            "chunk_index": int(chunk["chunk_index"])
        } for chunk in chunks]
        
        # Chroma handles batches of up to ~500 items nicely
        batch_size = 200
        for i in range(0, len(ids), batch_size):
            end = i + batch_size
            self.collection.upsert(
                ids=ids[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end]
            )
        logger.info(f"Upserted {len(chunks)} chunks into ChromaDB.")

    def delete_document(self, doc_id: str):
        """
        Deletes all chunks belonging to a document from ChromaDB.
        """
        try:
            self.collection.delete(where={"document_id": doc_id})
            logger.info(f"Deleted chunks for document {doc_id} from ChromaDB.")
        except Exception as e:
            logger.warning(f"Error deleting chunks for {doc_id}: {e}")

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search for a query.
        Returns retrieved chunks with cosine distances converted to relevance scores.
        """
        if self.collection.count() == 0:
            return []
            
        k = min(top_k, self.collection.count())
        results = self.collection.query(
            query_texts=[query],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )
        
        retrieved_chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for doc_text, meta, dist in zip(docs, metas, distances):
                # Cosine distance in chromadb ranges from 0 (identical) to 2 (opposite)
                # Convert to similarity score between 0 and 1
                similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                retrieved_chunks.append({
                    "document_id": meta.get("document_id", ""),
                    "document_name": meta.get("document_name", "Runbook"),
                    "page_number": int(meta.get("page_number", 1)),
                    "chunk_index": int(meta.get("chunk_index", 0)),
                    "text": doc_text,
                    "relevance_score": round(similarity, 4)
                })
                
        return retrieved_chunks

    def count(self) -> int:
        return self.collection.count()

    def get_health(self) -> Dict[str, Any]:
        try:
            count = self.collection.count()
            return {
                "status": "connected",
                "collection": self.collection_name,
                "total_chunks": count,
                "persist_dir": self.persist_dir
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

# Singleton accessor
_vector_service_instance = None

def get_vector_service() -> VectorService:
    global _vector_service_instance
    if _vector_service_instance is None:
        _vector_service_instance = VectorService()
    return _vector_service_instance
