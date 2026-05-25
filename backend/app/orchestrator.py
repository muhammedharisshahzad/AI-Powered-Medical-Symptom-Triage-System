from __future__ import annotations

import json

from app.agents import CareRecommender, RiskAssessor, SymptomAnalyzer
from app.core.config import get_settings
from app.core.groq_client import GroqClient
from app.schemas.triage import AgentOutput, TriageRequest, TriageResponse, Verdict


class MedicalOrchestrator:
    def __init__(self, client: GroqClient) -> None:
        self._client = client
        self._agents = [
            SymptomAnalyzer(client),
            RiskAssessor(client),
            CareRecommender(client),
        ]

    def run(self, request: TriageRequest) -> TriageResponse:
        context = {
            "age": request.age,
            "sex": request.sex,
            "medications": request.medications,
        }
        user_text = self._enrich_input(request)

        outputs: list[AgentOutput] = []
        for agent in self._agents:
            outputs.append(agent.run(user_text, context=context))

        verdict, final_report = self._synthesize(user_text, outputs)
        return TriageResponse(verdict=verdict, final_report=final_report, agents=outputs)

    def _enrich_input(self, request: TriageRequest) -> str:
        extras: list[str] = []
        if request.age is not None:
            extras.append(f"Age: {request.age}")
        if request.sex:
            extras.append(f"Sex: {request.sex}")
        if request.medications:
            extras.append(f"Medications: {request.medications}")

        if not extras:
            return request.user_input

        return f"{request.user_input}\n\nAdditional info:\n" + "\n".join(extras)

    def _synthesize(self, user_input: str, outputs: list[AgentOutput]) -> tuple[Verdict, str]:
        system_prompt = (
            "You are a medical triage orchestrator. "
            "Return a final verdict and a clear, professional report for patients."
        )
        agent_summaries = "\n\n".join(
            f"[{o.name} | {o.pattern}]\n{o.content}" for o in outputs
        )
        user_prompt = (
            "Based on the user symptoms and the agent outputs, "
            "return JSON with keys: verdict and final_report.\n"
            "verdict must be one of: Emergency, See Doctor, Home Care.\n"
            "final_report must be human-friendly text (not JSON) using sections:\n"
            "Summary:\n- <short paragraph>\n\n"
            "Why this verdict:\n- <bullets>\n\n"
            "Care guidance:\n- <bullets>\n\n"
            "When to seek urgent care:\n- <bullets>\n\n"
            "Disclaimer:\n- <1 line>\n\n"
            f"User symptoms:\n{user_input}\n\n"
            f"Agent outputs:\n{agent_summaries}"
        )
        raw = self._client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        parsed = self._parse_synthesis(raw)
        return parsed["verdict"], parsed["final_report"]

    def _parse_synthesis(self, raw: str) -> dict[str, str]:
        try:
            data = json.loads(raw)
            verdict = data.get("verdict", "See Doctor")
            final_report = data.get("final_report", raw)
            return {"verdict": verdict, "final_report": final_report}
        except json.JSONDecodeError:
            pass

        verdict = "See Doctor"
        lowered = raw.lower()
        if "emergency" in lowered:
            verdict = "Emergency"
        elif "home care" in lowered:
            verdict = "Home Care"

        return {"verdict": verdict, "final_report": raw}


def build_orchestrator() -> MedicalOrchestrator:
    settings = get_settings()
    client = GroqClient(api_key=settings["groq_api_key"], model=settings["groq_model"])
    return MedicalOrchestrator(client)
