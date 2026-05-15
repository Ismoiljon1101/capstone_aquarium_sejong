from ollama import chat as ollama_chat_call, ChatResponse
import psycopg2
from decouple import config
import json
import requests
from datetime import datetime

OLLAMA_MODEL = config('OLLAMA_MODEL', default='gemma3:4b')
LLM_PROVIDER = config('LLM_PROVIDER', default='ollama')
OPENROUTER_KEY = config('OPENROUTER_API_KEY', default='')
OPENROUTER_MODEL = config('OPENROUTER_MODEL', default='google/gemini-flash-1.5')
DATABASE_SERVER = config('DATABASE_SERVER', default='')

def save_session(transcribed_text, ai_response):
    """Save voice session to database"""
    if not DATABASE_SERVER:
        return
    try:
        conn = psycopg2.connect(DATABASE_SERVER)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO voice_sessions (transcribedText, aiResponse, wakeWordAt, durationMs, createdAt)
            VALUES (%s, %s, %s, %s, NOW());
        """, (transcribed_text, ai_response, datetime.now(), 2000))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error saving session: {e}")

def load_history():
    """Load history from voice_sessions"""
    if not DATABASE_SERVER:
        return []
    try:
        conn = psycopg2.connect(DATABASE_SERVER)
        cur = conn.cursor()
        cur.execute("SELECT transcribedText, aiResponse FROM voice_sessions ORDER BY createdAt DESC LIMIT 10")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        history_list = []
        for row in reversed(rows):
            history_list.append({"role": "user", "content": row[0]})
            history_list.append({"role": "assistant", "content": row[1]})
        return history_list
    except:
        return []

# State
history = load_history()
if not history:
    history = [
        {"role": "system", "content": "You are Veronica, an AI assistant for smart aquarium. Only short answers. Only English."}
    ]

def ollama_chat(user_prompt):
    """Chat with the configured LLM provider (OpenRouter or Ollama)"""
    try:
        history.append({"role": "user", "content": user_prompt})
        
        assistant_msg = ""
        
        if LLM_PROVIDER == 'openrouter' and OPENROUTER_KEY:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "HTTP-Referer": "https://github.com/Ismoiljon1101/capstone_aquarium_sejong",
                    "X-Title": "Fishlinic Aquarium",
                },
                data=json.dumps({
                    "model": OPENROUTER_MODEL,
                    "messages": history
                })
            )
            res_json = response.json()
            assistant_msg = res_json['choices'][0]['message']['content']
        else:
            # Fallback to Ollama
            response: ChatResponse = ollama_chat_call(model=OLLAMA_MODEL, messages=history)
            assistant_msg = response['message']['content']

        history.append({"role": "assistant", "content": assistant_msg})
        
        # PERSIST TO DB
        save_session(user_prompt, assistant_msg)
        
        return assistant_msg
    except Exception as e:
        print(f"LLM Error ({LLM_PROVIDER}): {e}")
        return "Sorry, I'm having trouble thinking right now."