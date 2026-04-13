from datetime import datetime
from utils import opening_text 
import random as rand 
import speech_recognition as sr 
from tts_init import vs_speak
import time
from wake_up_init import wakeup
import speech_recognition as sr
from datetime import datetime
import winsound
def playaudio(file_path):
    try:
        # Simple native windows audio playback
        winsound.PlaySound(file_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
    except:
        pass
import behaviors
import llm_manager
from api_client import send_voice_query
from voice_inp import voice_speak
from authentication_manager import Authenticator
from gui_manager import start_gui_background, stop_gui, update_gui_response, set_gui_listening_status

#Give a random choice of response 
def pick_choice(): 
    random_number = rand.randint(0,3)
    response = opening_text[random_number]
    print(f"Random choice : {response}")
    update_gui_response(response)
    vs_speak(response)

def user_input(language="en-US"):
    try:
        # Play ping and start recording simultaneously
        # User can speak immediately when they hear the ping
        import threading
        ping_thread = threading.Thread(target=lambda: playaudio("audio/ping.mp3"), daemon=True)
        ping_thread.start()
        
        # Start recording immediately (ping sound will be filtered out)
        query = voice_speak()
        print(f"Your input: {query}")

        exit_words = ("exit", "stop", "bye", "goodbye", "quit")
        if not any(w in query for w in exit_words):
            pass
        else:
            hour = datetime.now().hour
            if hour >= 21 or hour < 6:
                response = "Good night! Take care."
                update_gui_response(response)
                vs_speak(response)
            else:
                response = "Goodbye sir! Have a good day!"
                update_gui_response(response)
                vs_speak(response)
            raise SystemExit 

        return query

    except sr.WaitTimeoutError:
        response = "I didn't hear anything. Please try again."
        update_gui_response(response)
        vs_speak(response)
        return ""
    except sr.UnknownValueError:
        response = "Sorry sir! Please say again."
        update_gui_response(response)
        vs_speak(response)
        return ""
    except sr.RequestError as e:
        response = "Recognition service error. Please try again later."
        update_gui_response(response)
        vs_speak(response)
        return ""

#Greeting protocols 
def greeting():
    hour = datetime.now().hour
    if hour >= 0 and hour < 12:
        vs_speak("Good morning. My name is Veronica, how can I help you ?")
    elif hour >= 12 and hour < 18:
        vs_speak("Good afternoon. My name is Veronica, how can I help you ?")
    elif hour >= 18 and hour < 24: 
        vs_speak("Good evening. My name is Veronica, how can I help you ?")

if __name__ == "__main__":
    # Pre-load Whisper model in background to avoid first-call delay
    print("Pre-loading Whisper model...")
    import threading
    def preload_model():
        from voice_inp import _load_whisper_model
        _load_whisper_model()
    model_thread = threading.Thread(target=preload_model, daemon=True)
    model_thread.start()
    
    # Start GUI in background
    try:
        gui_process = start_gui_background()
        time.sleep(2)  # Give GUI time to initialize
    except Exception as e:
        print(f"Warning: Could not start GUI: {e}")
        gui_process = None
    
    # wakeup()
    time.sleep(1)
    update_gui_response("Veronica initiated !")
    vs_speak("Veronica initiated !")
    update_gui_response("Please stand by !")
    vs_speak("Please stand by !")
    time.sleep(1)
    # Update GUI with greeting before speaking
    hour = datetime.now().hour
    if hour >= 0 and hour < 12:
        greeting_text = "Good morning. My name is Veronica, how can I help you ?"
    elif hour >= 12 and hour < 18:
        greeting_text = "Good afternoon. My name is Veronica, how can I help you ?"
    else:
        greeting_text = "Good evening. My name is Veronica, how can I help you ?"
    update_gui_response(greeting_text)
    greeting()
    
    try:
        while True:
            # Set listening status for wake word detection
            set_gui_listening_status(True)
            wakeup()
            set_gui_listening_status(False)
            
            # Set listening status for voice input
            set_gui_listening_status(True)
            q = user_input().lower()
            set_gui_listening_status(False)
            if 'open camera' in q or 'turn on camera' in q:
                pick_choice()
                update_gui_response("Camera is opened now")
                vs_speak("Camera is opened now")
                behaviors.open_camera()
            elif 'turn off camera' in q or 'close camera' in q or 'stop camera' in q:
                if behaviors.is_camera_running():
                    update_gui_response("Turning off camera")
                    vs_speak("Turning off camera")
                    behaviors.close_camera()
                    # Wait a moment for camera to close
                    time.sleep(0.5)
                    update_gui_response("Camera has been turned off")
                    vs_speak("Camera has been turned off")
                else:
                    update_gui_response("Camera is not running")
                    vs_speak("Camera is not running")
            elif 'water report' in q:
                response = "Okay Sir ! Let me analyze and summarize it then I will let you know"
                update_gui_response(response)
                vs_speak(response)
                behaviors.water_report()
            elif 'authenticator check' in q:
                update_gui_response("Please prepare your QR code")
                vs_speak("Please prepare your QR code")
                handler = Authenticator()
                success = handler.verify_user()
                if success:
                    response = "Verification completed!"
                    update_gui_response(response)
                    vs_speak("\n" + response)
                else:
                    response = "Verification failed"
                    update_gui_response(response)
                    vs_speak("\n" + response)
            elif 'feed' in q:
                update_gui_response("Please wait a few second, i will feed the fish for you")
                vs_speak("Please wait a few second, i will feed the fish for you")
                behaviors.fish_feeder_active()
                update_gui_response("Fish Feeder has been triggered")
                vs_speak("Fish feeder has been triggered")
            elif q != "":
                # Route through NestJS /voice/query — bundles live sensor context
                response = send_voice_query(q)
                # Fallback to direct Ollama if NestJS unavailable
                if not response or "unavailable" in response.lower() or "timed out" in response.lower():
                    response = llm_manager.ollama_chat(q)
                update_gui_response(response)
                vs_speak(response)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except SystemExit:
        pass
    finally:
        # Close camera if running
        if behaviors.is_camera_running():
            behaviors.close_camera()
            time.sleep(0.5)  # Give camera time to close
        if gui_process:
            stop_gui()