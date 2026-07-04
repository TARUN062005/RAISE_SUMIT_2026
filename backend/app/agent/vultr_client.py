import sys
import logging
import httpx
import asyncio
from typing import Dict, Any, List
from backend.app.core.config import settings

logger = logging.getLogger("backend.vultr")

class VultrClient:
    def __init__(self):
        self.api_key = settings.VULTR_API_KEY
        self.base_url = settings.VULTR_BASE_URL.rstrip('/')
        self.model = settings.VULTR_MODEL
        
        # Task 5: Fail immediately if VULTR_API_KEY or VULTR_MODEL is missing
        if not self.api_key:
            raise ValueError("Configuration Error: VULTR_API_KEY is not set in backend/.env")
        if not self.model:
            raise ValueError("Configuration Error: VULTR_MODEL is not set in backend/.env. Automatic model discovery is disabled.")
            
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
    async def chat_completion(self, messages: List[Dict[str, str]], temperature: float = 0.15, max_retries: int = 3) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        
        url = f"{self.base_url}/chat/completions"
        backoff = 1.0  # Initial backoff in seconds
        
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    logger.info("Sending chat completion request to Vultr (attempt %d/%d)...", attempt, max_retries)
                    response = await client.post(url, headers=self.headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if not choices:
                            raise RuntimeError(f"Vultr API returned empty choices. Response: {data}")
                        return choices[0]["message"]["content"]
                        
                    # Task 4: Capture status, headers, and body on error
                    status_code = response.status_code
                    headers = dict(response.headers)
                    body = response.text
                    
                    logger.error(
                        "Vultr API Error (Completions) %d on attempt %d.\nHeaders: %s\nBody: %s",
                        status_code, attempt, headers, body
                    )
                    
                    # If it's a client error (except rate limit 429), don't retry
                    if 400 <= status_code < 500 and status_code != 429:
                        raise httpx.HTTPStatusError(
                            f"Vultr API Client Error: {status_code} - Body: {body}",
                            request=response.request,
                            response=response
                        )
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                logger.warning("Vultr request failed on attempt %d: %s", attempt, str(e))
                if attempt == max_retries:
                    raise
            
            # Exponential backoff
            await asyncio.sleep(backoff)
            backoff *= 2
            
        raise RuntimeError("Vultr completions failed after maximum retries")

    @classmethod
    async def run_startup_health_check(cls) -> bool:
        # Task 9: Add startup health check logging
        def safe_print(text: str):
            try:
                print(text)
            except UnicodeEncodeError:
                print(text.replace("✓", "[OK]").replace("✗", "[FAIL]"))

        safe_print("\n--- Vultr Serverless Inference Health Check ---")
        
        # 1. Model configured check
        model = settings.VULTR_MODEL
        if not model:
            safe_print("✗ Model configured: FAILED")
            print("Error: VULTR_MODEL is missing in env configurations.")
            sys.exit(1)
        safe_print(f"✓ Model configured: {model}")
        
        # 2. Authentication existence check
        base_url = settings.VULTR_BASE_URL
        api_key = settings.VULTR_API_KEY
        if not api_key:
            safe_print("✗ Authentication: FAILED (VULTR_API_KEY is not set)")
            sys.exit(1)
            
        # 3. Connection and authentication check via a test request
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "temperature": 0.1
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                
                # Check reachability
                safe_print("✓ Vultr endpoint reachable")
                
                if response.status_code == 200:
                    safe_print("✓ Authentication successful")
                    safe_print("✓ Chat completion test successful")
                    print("Vultr Health Check: ALL PASSED\n")
                    return True
                else:
                    # Task 4 & 9: Print exact response from Vultr on failure
                    safe_print("✗ Vultr Health Check failed during API call!")
                    print(f"Status Code: {response.status_code}")
                    print("Response Headers:")
                    for k, v in response.headers.items():
                        print(f"  {k}: {v}")
                    print("Response Body:")
                    print(response.text)
                    sys.exit(1)
            except Exception as e:
                safe_print("✗ Vultr Health Check failed: Connection Error")
                print(f"Details: {str(e)}")
                sys.exit(1)
