from __future__ import annotations

from groq import BadRequestError, Groq


class GroqClient:
    def __init__(self, api_keys: list[str], model: str) -> None:
        keys = [key.strip() for key in api_keys if key and key.strip()]
        if not keys:
            raise ValueError("GROQ_API_KEY is missing")
        if not model:
            raise ValueError("GROQ_MODEL is missing")
        self._model = model
        self._clients = [Groq(api_key=key) for key in keys]
        self._active_index = 0

    def _is_rate_limited(self, exc: Exception) -> bool:
        status = getattr(exc, "status_code", None)
        if status == 429:
            return True
        response = getattr(exc, "response", None)
        if response is not None:
            status = getattr(response, "status_code", None) or getattr(
                response, "status", None
            )
            if status == 429:
                return True
        message = str(exc).lower()
        return "rate limit" in message or "429" in message

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 700,
    ) -> str:
        last_exc: Exception | None = None
        for offset in range(len(self._clients)):
            index = (self._active_index + offset) % len(self._clients)
            client = self._clients[index]
            try:
                response = client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                self._active_index = index
                content = response.choices[0].message.content
                return content or ""
            except BadRequestError as exc:
                raise ValueError(
                    "Groq request failed. Update GROQ_MODEL with a supported model."
                ) from exc
            except Exception as exc:
                if len(self._clients) > 1 and self._is_rate_limited(exc):
                    last_exc = exc
                    continue
                raise

        if last_exc is not None:
            raise last_exc
        raise RuntimeError("Groq request failed without a response")
