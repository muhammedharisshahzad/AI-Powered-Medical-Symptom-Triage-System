from typing import Literal

from pydantic import BaseModel, Field


Verdict = Literal["Emergency", "See Doctor", "Home Care"]


class TriageRequest(BaseModel):
    user_input: str = Field(..., min_length=5, description="User symptom description")
    age: int | None = Field(default=None, ge=0, le=120)
    sex: str | None = Field(default=None, description="Optional self-reported sex")
    medications: str | None = Field(default=None, description="Optional meds list")


class AgentOutput(BaseModel):
    name: str
    pattern: str
    content: str


class TriageResponse(BaseModel):
    verdict: Verdict
    final_report: str
    agents: list[AgentOutput]
