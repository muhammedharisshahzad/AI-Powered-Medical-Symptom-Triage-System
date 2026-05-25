from app.agents.base import Agent
from app.core.groq_client import GroqClient
from app.schemas.triage import AgentOutput
from app.services.tools import check_drug_interactions, check_red_flags


class RiskAssessor(Agent):
    name = "Risk Assessor"
    pattern = "Tool Use"

    def __init__(self, client: GroqClient) -> None:
        self._client = client

    def run(self, user_input: str, context: dict | None = None) -> AgentOutput:
        context = context or {}
        meds_text = context.get("medications") or ""
        tool_input = f"{user_input}\n\nMedications: {meds_text}".strip()

        red_flags = check_red_flags(tool_input)
        interactions = check_drug_interactions(tool_input)

        system_prompt = (
            "You are a medical risk assessor. "
            "Use the tool results to assess urgency."
        )
        user_prompt = (
            "Tool Results:\n"
            f"- Red flags: {red_flags or 'None found'}\n"
            f"- Drug interactions: {interactions or 'None found'}\n\n"
            "Now provide a risk summary using this format:\n"
            "Risk level: <Low/Moderate/High>\n"
            "Red flag notes:\n- <bullets>\n"
            "Interaction notes:\n- <bullets>\n"
            "Urgency considerations:\n- <bullets>\n\n"
            f"Symptoms and context:\n{tool_input}"
        )
        content = self._client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        return AgentOutput(name=self.name, pattern=self.pattern, content=content)
