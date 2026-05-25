from __future__ import annotations

from groq import BadRequestError, Groq


class GroqClient:
    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise ValueError("GROQ_API_KEY is missing")
        if not model:
            raise ValueError("GROQ_MODEL is missing")
        self._model = model
        self._client = Groq(api_key=api_key)

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 700,
    ) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except BadRequestError as exc:
            raise ValueError(
                "Groq request failed. Update GROQ_MODEL with a supported model."
            ) from exc
        content = response.choices[0].message.content
        return content or ""
