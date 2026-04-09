from ollama import chat, ChatResponse
import psycopg2
from decouple import config
import json

MODEL_ID = config('OLLAMA_MODEL', default='qwen2.5:3b')
DATABASE_SERVER = config('DATABASE_SERVER')
DEVICE_ID = 1


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
from datetime import datetime
history = load_history()
if not history:
    history = [
        {"role": "system", "content": "You are Veronica, an AI assistant for smart aquarium. Only short answers. Only English."}
    ]

def ollama_chat(user_prompt):
    """Chat with Ollama and persist session"""
    try:
        history.append({"role": "user", "content": user_prompt})
        response: ChatResponse = chat(model=MODEL_ID, messages=history)
        assistant_msg = response['message']['content']
        history.append({"role": "assistant", "content": assistant_msg})
        
        # PERSIST TO DB
        save_session(user_prompt, assistant_msg)
        
        return assistant_msg
    except Exception as e:
        print(f"Ollama error: {e}")
        return "Check Ollama server and connection"