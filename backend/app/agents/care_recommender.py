from app.agents.base import Agent
from app.core.groq_client import GroqClient
from app.schemas.triage import AgentOutput


class CareRecommender(Agent):
    name = "Care Recommender"
    pattern = "Prompt Chaining"

    def __init__(self, client: GroqClient) -> None:
        self._client = client

    def run(self, user_input: str, context: dict | None = None) -> AgentOutput:
        system_prompt = (
            "You are a care planning assistant. "
            "Provide safe, practical guidance and clear escalation rules."
        )

        # Step 1: goals and boundaries.
        step1_prompt = (
            "Create care goals and self-care boundaries using this format:\n"
            "Care goals:\n- <bullets>\n"
            "Self-care boundaries:\n- <bullets>\n"
            "What to monitor:\n- <bullets>\n\n"
            f"Symptoms:\n{user_input}"
        )
        step1 = self._client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": step1_prompt},
            ],
            temperature=0.2,
        )

        # Step 2: final care plan based on step 1.
        step2_prompt = (
            "Using the goals and boundaries below, produce a care plan:\n"
            "Format:\n"
            "Home care steps:\n- <bullets>\n"
            "OTC guidance (if appropriate):\n- <bullets>\n"
            "When to seek care:\n- <bullets>\n\n"
            f"Goals and boundaries:\n{step1}\n\n"
            f"Symptoms:\n{user_input}"
        )
        content = self._client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": step2_prompt},
            ],
            temperature=0.2,
        )
        return AgentOutput(name=self.name, pattern=self.pattern, content=content)
