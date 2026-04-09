from ollama import chat, ChatResponse
import psycopg2
from decouple import config
import json

MODEL_ID = config('OLLAMA_MODEL', default='qwen2.5:3b')
DATABASE_SERVER = config('DATABASE_SERVER')
DEVICE_ID = 1


def history_save():
    conn = psycopg2.connect(DATABASE_SERVER)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO chat_history (device_id, message)
        VALUES (%s, %s);
    """, (DEVICE_ID,json.dumps(history)))
    conn.commit()
    cur.close()
    conn.close()

def load_history():
    conn = psycopg2.connect(DATABASE_SERVER)
    cur = conn.cursor()

    cur.execute("SELECT message FROM chat_history")

    rows = cur.fetchall()

    cur.close()
    conn.close()

    if not rows:
        print("⚠️ No history found.")
        return []

    merged_history = []

    for row in rows:
        try:
            messages = json.loads(row[0])   # each row's JSON
            merged_history.extend(messages) # add to final list
        except json.JSONDecodeError:
            print("❌ JSON decode error on row, skipping...")

    return merged_history



#Short-term memory function 
history = load_history()

if not history:
    history = [
        {"role": "system", "content": "You are Veronica, an AI assistant for smart aquarium. Only short answers. Only English."}
    ]

#Ollama model initalizer
def ollama_chat(user_prompt):
    try:
        # Add user message to history
        history.append({"role": "user", "content": user_prompt})

        # Send entire short-term memory
        response: ChatResponse = chat(
            model=MODEL_ID,
            messages=history
        )

        assistant_msg = response['message']['content']

        # Add assistant reply to history
        history.append({"role": "assistant", "content": assistant_msg})

        return assistant_msg

    except Exception as e:
        print(e)
        return "Check Ollama server and connection"