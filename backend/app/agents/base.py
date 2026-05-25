from abc import ABC, abstractmethod

from app.schemas.triage import AgentOutput


class Agent(ABC):
    name: str
    pattern: str

    @abstractmethod
    def run(self, user_input: str, context: dict | None = None) -> AgentOutput:
        raise NotImplementedError
