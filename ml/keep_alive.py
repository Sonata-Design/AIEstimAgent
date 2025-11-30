"""
Keep Render service alive by pinging it every 10 minutes
Run this on your local machine or use a free service like cron-job.org
"""
import requests
import time

ML_SERVICE_URL = "https://aiestimagent.onrender.com"

def ping_service():
    try:
        response = requests.get(f"{ML_SERVICE_URL}/healthz", timeout=30)
        if response.status_code == 200:
            print(f"✓ Service is alive at {time.strftime('%H:%M:%S')}")
        else:
            print(f"⚠ Service returned {response.status_code}")
    except Exception as e:
        print(f"✗ Failed to ping service: {e}")

if __name__ == "__main__":
    print("Starting keep-alive service...")
    print(f"Pinging {ML_SERVICE_URL} every 10 minutes")
    
    while True:
        ping_service()
        time.sleep(600)  # 10 minutes
