from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.orchestrator import build_orchestrator
from app.schemas import TriageRequest, TriageResponse

app = FastAPI(title="Medical Symptom Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://ai-powered-medical-symptom-triage.vercel.app",
    "https://ai-powered-medical-symptom-triage-system.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_orchestrator = None


def get_orchestrator():
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = build_orchestrator()
    return _orchestrator


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest) -> TriageResponse:
    try:
        return get_orchestrator().run(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Upstream model error. Check GROQ_MODEL and GROQ_API_KEY.",
        ) from exc
