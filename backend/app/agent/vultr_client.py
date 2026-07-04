import httpx
from backend.app.core.config import settings

class VultrClient:
    def __init__(self):
        self.api_key = settings.VULTR_API_KEY
        self.base_url = settings.VULTR_BASE_URL
        self.model = settings.VULTR_MODEL
        
        if not self.api_key:
            raise ValueError("VULTR_API_KEY is not set in configuration")
            
        if not self.model:
            self.model = self._resolve_model()

    def _resolve_model(self) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            response = httpx.get(f"{self.base_url}/chat/models", headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            models = data.get("data", [])
            if not models:
                raise ValueError("No models returned from Vultr")
            
            for m in models:
                model_id = m.get("id", "")
                if "instruct" in model_id.lower() or "chat" in model_id.lower() or "llama" in model_id.lower():
                    return model_id
            return models[0]["id"]
        except Exception as e:
            raise RuntimeError(f"Vultr model resolution failed: {e}")

    async def chat_completion(self, messages: list, temperature: float = 0.15) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
