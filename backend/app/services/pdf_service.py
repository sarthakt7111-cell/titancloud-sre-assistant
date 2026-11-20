import fitz  # PyMuPDF
import re
import uuid
from typing import List, Dict, Any, Tuple
from backend.app.core.config import settings

class PDFService:
    @staticmethod
    def extract_text_with_pages(filepath: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF preserving 1-indexed page numbers.
        Returns a list of dicts: [{"page": int, "text": str}]
        """
        doc = fitz.open(filepath)
        pages_content = []
        
        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            raw_text = page.get_text("text")
            
            # Clean text lightly
            cleaned_text = PDFService.clean_text(raw_text)
            if cleaned_text:
                pages_content.append({
                    "page_number": page_num,
                    "text": cleaned_text
                })
        
        doc.close()
        return pages_content

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans extracted PDF text while preserving sentence structure and technical terms.
        """
        if not text:
            return ""
        
        # Replace non-breaking spaces and irregular whitespace
        text = text.replace('\xa0', ' ').replace('\r\n', '\n').replace('\r', '\n')
        # Normalize excessive consecutive newlines (more than 2) to 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Normalize multiple horizontal spaces
        text = re.sub(r'[ \t]{2,}', ' ', text)
        return text.strip()

    @staticmethod
    def chunk_document(
        pages_content: List[Dict[str, Any]],
        doc_id: str,
        filename: str,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> List[Dict[str, Any]]:
        """
        Splits text into chunks of chunk_size characters with chunk_overlap,
        strictly preserving the original page number for each chunk.
        """
        chunk_size = chunk_size or settings.CHUNK_SIZE
        chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        
        all_chunks = []
        global_chunk_idx = 0
        
        for item in pages_content:
            page_num = item["page_number"]
            page_text = item["text"]
            
            if not page_text:
                continue
                
            # If the entire page text is smaller than chunk_size, keep as a single chunk
            if len(page_text) <= chunk_size:
                global_chunk_idx += 1
                all_chunks.append({
                    "id": f"{doc_id}_p{page_num}_c{global_chunk_idx}",
                    "document_id": doc_id,
                    "document_name": filename,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx,
                    "text": page_text,
                    "char_count": len(page_text)
                })
                continue
            
            # Otherwise slide a window with overlap
            start = 0
            text_len = len(page_text)
            
            while start < text_len:
                end = min(start + chunk_size, text_len)
                
                # If we are not at the end of the text, try to find a natural boundary (newline, period, space)
                if end < text_len:
                    # Look backwards up to 100 characters for a break
                    lookback_limit = max(start + chunk_size // 2, end - 100)
                    breakpoint = -1
                    for delim in ['\n\n', '\n', '. ', '; ', ' ']:
                        pos = page_text.rfind(delim, lookback_limit, end)
                        if pos != -1:
                            breakpoint = pos + len(delim)
                            break
                    if breakpoint != -1 and breakpoint > start:
                        end = breakpoint
                
                chunk_str = page_text[start:end].strip()
                if chunk_str:
                    global_chunk_idx += 1
                    all_chunks.append({
                        "id": f"{doc_id}_p{page_num}_c{global_chunk_idx}",
                        "document_id": doc_id,
                        "document_name": filename,
                        "page_number": page_num,
                        "chunk_index": global_chunk_idx,
                        "text": chunk_str,
                        "char_count": len(chunk_str)
                    })
                
                # Move forward by (end - start) minus overlap
                step = (end - start) - chunk_overlap
                if step <= 0:
                    step = max(1, chunk_size // 2)
                start += step
                
        return all_chunks
