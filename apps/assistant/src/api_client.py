import requests
from decouple import config

BACKEND_URL = config('BACKEND_URL', default='http://localhost:3000')


def send_voice_query(text: str, snapshot_id: int = None) -> str:
    """
    POST transcribed text to NestJS /voice/query endpoint.
    NestJS bundles live sensor context + snapshot into the Ollama prompt.

    Args:
        text: Transcribed speech text from Whisper.
        snapshot_id: Optional camera snapshot ID for visual context.

    Returns:
        AI response string from NestJS voice.service.ts.
    """
    payload: dict = {"text": text}
    if snapshot_id is not None:
        payload["snapshotId"] = snapshot_id

    try:
        response = requests.post(
            f"{BACKEND_URL}/voice/query",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.ConnectionError:
        print(f"[api_client] Backend not reachable at {BACKEND_URL}")
        return "Backend service is unavailable. Please check the connection."
    except requests.exceptions.Timeout:
        print("[api_client] Request to backend timed out.")
        return "Request timed out. Please try again."
    except Exception as e:
        print(f"[api_client] Unexpected error: {e}")
        return "An error occurred contacting the backend."
