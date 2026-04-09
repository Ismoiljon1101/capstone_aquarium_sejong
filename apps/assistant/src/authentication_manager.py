from decouple import config
from typing import Optional, Dict
import requests
import cv2
import time
from gui_manager import update_gui_camera_frame, set_gui_camera_status

DASHBOARD_URL = config('WEB_URL')

class Authenticator():
    def __init__(self, api_base_url: str =  DASHBOARD_URL):
        self.api_base_url = api_base_url
    def extract_token_from_url(self, url: str) -> Optional[str]:
        try:
            if "token=" in url:
                token = url.split("token=")[1].split("&")[0]
                return token
            return None
        except Exception as e:
            print(f"Error extracting token: {e}")
            return None
    def check_verification_status(self, token: str) -> Dict:
        try:
            url = f"{self.api_base_url}/api/auth/verification/status"
            params = {"token": token}

            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()

            data = response.json()
            return data 
        except requests.exceptions.RequestException as e:
            print(f"Error checking verification status: {e}")
            return {"valid" : False, "error": str(e)}
    def complete_verification(self, token: str) -> Dict:
        try:
            url = f"{self.api_base_url}/api/auth/verification/complete"
            payload = {"token": token}

            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()

            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error completing verification: {e}")
            return {"ok": False, "error": str(e)}
    def scan_qr(self):
        cap = cv2.VideoCapture(1)
        detector = cv2.QRCodeDetector()
        set_gui_camera_status(True)

        print("📷 Scanning QR... (Press 'q' to quit)")

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # Resize if too large for GUI
                h, w = frame.shape[:2]
                max_dim = 640
                if max(h, w) > max_dim:
                    scale = max_dim / max(h, w)
                    frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
                
                data, bbox, _ = detector.detectAndDecode(frame)

                if bbox is not None:
                    # bbox is shape (1, 4, 2). Convert coords to int
                    points = bbox.astype(int).reshape(-1, 2)

                    # Draw box
                    for i in range(len(points)):
                        pt1 = tuple(points[i])
                        pt2 = tuple(points[(i + 1) % len(points)])
                        cv2.line(frame, pt1, pt2, (0, 255, 0), 2)

                    if data:
                        print("✅ QR Detected!")
                        print("Data:", data)
                        # Update GUI with final frame
                        update_gui_camera_frame(frame)
                        cap.release()
                        set_gui_camera_status(False)
                        return data

                # Update GUI with frame
                update_gui_camera_frame(frame)
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.03)  # ~30 FPS
        finally:
            cap.release()
            set_gui_camera_status(False)
    def verify_user(self) -> bool:
        """Main verification flow"""
        print("=== User Verification Process ===")
        
        # Step 1: Scan QR code
        print("\n1. Waiting for QR code scan...")
        qr_data = self.scan_qr()
        
        if not qr_data:
            print("No QR code detected")
            return False
        
        # Step 2: Extract token
        token = self.extract_token_from_url(qr_data)
        if not token:
            print("Invalid QR code format")
            return False
        
        print(f"Token extracted: {token[:8]}...")
        
        # Step 3: Check token status
        print("\n2. Validating token...")
        status = self.check_verification_status(token)
        
        if not status.get("valid"):
            error = status.get("error", "Unknown error")
            print(f"❌ Verification failed: {error}")
            return False
        
        print(f"✅ Token is valid")
        print(f"   User ID: {status.get('userId')}")
        print(f"   Email: {status.get('userEmail')}")
        print(f"   Expires in: {status.get('expiresIn')} seconds")
        
        # Step 4: Complete verification
        print("\n3. Completing verification...")
        result = self.complete_verification(token)
        
        if result.get("ok"):
            print("✅ User verified successfully!")
            return True
        else:
            error = result.get("error", "Unknown error")
            print(f"❌ Verification completion failed: {error}")
            return False 