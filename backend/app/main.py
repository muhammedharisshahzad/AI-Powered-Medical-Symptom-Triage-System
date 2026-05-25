from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.orchestrator import build_orchestrator
from app.schemas import TriageRequest, TriageResponse

app = FastAPI(title="Medical Symptom Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = build_orchestrator()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest) -> TriageResponse:
    return orchestrator.run(request)
