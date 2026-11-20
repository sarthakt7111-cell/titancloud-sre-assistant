import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent
ENV_PATH = ROOT_DIR / ".env"

# Load .env if present
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "TitanCloud SRE Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Host
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Gemini API Key
    _gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Paths
    PERSIST_DIR: str = str(ROOT_DIR / "chroma_db")
    DATA_DIR: str = str(ROOT_DIR / "data")
    DB_PATH: str = str(ROOT_DIR / "titancloud.db")
    
    # RAG Settings
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "4"))
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "850"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    
    # Strict Grounding System Prompt
    SYSTEM_PROMPT: str = """You are TitanCloud's Enterprise SRE Incident Runbook Assistant.

Answer questions using ONLY the retrieved document context.

Never invent SLA percentages, error-code thresholds, escalation times, troubleshooting commands, or company policies.

If the requested information is not available in the retrieved context, clearly respond:
"I could not find this information in the TitanCloud SRE Incident Runbook."

Always include source page numbers when available.

Distinguish between verified runbook information and information requiring external verification.

Never present assumptions as official company policy.

For questions requiring current external information, such as stock prices, clearly state that the runbook does not provide real-time financial data."""

    @property
    def GEMINI_API_KEY(self) -> str:
        return self._gemini_api_key or os.getenv("GEMINI_API_KEY", "")

    def set_gemini_api_key(self, key: str):
        self._gemini_api_key = key.strip()
        os.environ["GEMINI_API_KEY"] = self._gemini_api_key
        # Optionally persist to .env
        try:
            lines = []
            key_written = False
            if ENV_PATH.exists():
                with open(ENV_PATH, "r") as f:
                    lines = f.readlines()
                new_lines = []
                for line in lines:
                    if line.startswith("GEMINI_API_KEY="):
                        new_lines.append(f"GEMINI_API_KEY={self._gemini_api_key}\n")
                        key_written = True
                    else:
                        new_lines.append(line)
                lines = new_lines
            if not key_written:
                lines.append(f"GEMINI_API_KEY={self._gemini_api_key}\n")
            with open(ENV_PATH, "w") as f:
                f.writelines(lines)
        except Exception as e:
            print(f"Warning: could not write to .env: {e}")

settings = Settings()
