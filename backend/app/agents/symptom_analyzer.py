from app.agents.base import Agent
from app.core.groq_client import GroqClient
from app.schemas.triage import AgentOutput


class SymptomAnalyzer(Agent):
    name = "Symptom Analyzer"
    pattern = "ReAct"

    def __init__(self, client: GroqClient) -> None:
        self._client = client

    def run(self, user_input: str, context: dict | None = None) -> AgentOutput:
        # ReAct-style structure without exposing hidden chain-of-thought.
        system_prompt = (
            "You are a clinical symptom analysis assistant. "
            "Provide concise, structured analysis. "
            "Do not reveal internal chain-of-thought."
        )
        user_prompt = (
            "Analyze the symptoms using this format:\n"
            "Observation: <1-2 sentences>\n"
            "Rationale:\n- <short bullets>\n"
            "Key concerns:\n- <bullets>\n"
            "Possible categories:\n- <bullets>\n"
            "Clarifying questions:\n- <bullets>\n\n"
            f"Symptoms:\n{user_input}"
        )
        content = self._client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        return AgentOutput(name=self.name, pattern=self.pattern, content=content)
