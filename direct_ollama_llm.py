from typing import Any, Dict, List, Optional
import requests
import logging
from crewai import BaseLLM

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class DirectOllamaLLM(BaseLLM):
    """Direct Ollama LLM implementation that bypasses LiteLLM"""
    
    def __init__(
        self,
        model: str = "crewai-nous-hermes:latest",
        base_url: str = "http://localhost:11434",
        temperature: float = 0.7,
        context_window: int = 4096,
        num_predict: int = 1024,
        top_p: float = 0.95,
        timeout: int = 120,
    ):
        super().__init__(model=model)
        self.base_url = base_url
        self.temperature = temperature
        self.context_window = context_window
        self.num_predict = num_predict
        self.top_p = top_p
        self.timeout = timeout
    
    def _format_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Format messages for Ollama API"""
        formatted_messages = []
        
        for message in messages:
            if isinstance(message, str):
                # If message is a string, treat it as user content
                formatted_messages.append({
                    "role": "user",
                    "content": message
                })
            elif isinstance(message, dict):
                # If message is already a dict, ensure it has required fields
                if "content" not in message:
                    logger.warning(f"Message missing content: {message}")
                    continue
                    
                role = message.get("role", "user")
                formatted_messages.append({
                    "role": role,
                    "content": message["content"]
                })
        
        return formatted_messages

    def call(self, messages: List[Dict[str, str]], **kwargs: Any) -> str:
        """Make a direct call to Ollama API"""
        try:
            formatted_messages = self._format_messages(messages)
            
            # Prepare request payload
            payload = {
                "model": self.model,
                "messages": formatted_messages,
                "options": {
                    "temperature": self.temperature,
                    "num_ctx": self.context_window,
                    "num_predict": self.num_predict,
                    "top_p": self.top_p
                },
                "stream": False
            }
            
            # Add any additional parameters from kwargs
            if kwargs.get("system"):
                payload["system"] = kwargs["system"]
            
            # Make request to Ollama API
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout
            )
            
            # Check for successful response
            response.raise_for_status()
            result = response.json()
            
            if "message" not in result:
                raise ValueError(f"Unexpected response format: {result}")
                
            return result["message"]["content"]
            
        except requests.exceptions.Timeout:
            logger.error(f"Request timed out after {self.timeout} seconds")
            raise TimeoutError(f"Ollama request timed out after {self.timeout} seconds")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
            raise RuntimeError(f"Failed to communicate with Ollama: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise

    def generate(self, prompt: str, **kwargs: Any) -> str:
        """Generate a response for a single prompt"""
        messages = [{"role": "user", "content": prompt}]
        return self.call(messages, **kwargs) 