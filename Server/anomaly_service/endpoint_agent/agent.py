import platform
import socket
import subprocess
import time
import requests
import os

SERVER_URL = "http://localhost:4000"
EMAIL = "rozguy1@gmail.com"
PASSWORD = "Gr030806"
INTERVAL = 30

def login():
    res = requests.post(f"{SERVER_URL}/users/login", json={"email": EMAIL, "password": PASSWORD})
    print(f"Login status: {res.status_code}, response: {res.text}")
    if res.status_code != 200:
        print("Login failed")
        return None
    otp = input("Enter OTP: ")
    res = requests.post(f"{SERVER_URL}/users/verify-otp", json={"email": EMAIL, "otp": otp})
    if res.status_code != 200:
        print("OTP failed")
        return None
    return res.json().get("token")

def get_hostname():
    return socket.gethostname()

def get_os():
    return platform.system()

def get_os_version():
    return platform.version()

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "unknown"

def get_open_ports():
    open_ports = []
    common_ports = [21, 22, 23, 25, 53, 80, 443, 3000, 3306, 4000, 5432, 8080, 8443, 27017]
    for port in common_ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            result = s.connect_ex(("127.0.0.1", port))
            if result == 0:
                open_ports.append(port)
            s.close()
        except:
            pass
    return open_ports

def get_antivirus():
    system = platform.system()
    if system == "Windows":
        try:
            result = subprocess.run(
                ["powershell", "-Command",
                 "Get-MpComputerStatus | Select-Object -ExpandProperty AntivirusEnabled"],
                capture_output=True, text=True, timeout=5
            )
            return "True" in result.stdout
        except:
            return False
    return False

def get_pending_updates():
    if platform.system() == "Windows":
        try:
            result = subprocess.run(
                ["powershell", "-Command",
                 "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search('IsInstalled=0').Updates.Count"],
                capture_output=True, text=True, timeout=10
            )
            return int(result.stdout.strip())
        except:
            return -1
    return 0

def send_heartbeat(token):
    try:
        data = {
            "hostname":  get_hostname(),
            "os":        get_os(),
            "osVersion": get_os_version(),
            "ipAddress": get_ip(),
            "openPorts": get_open_ports(),
            "antivirus": get_antivirus(),
            "pendingUpdates": get_pending_updates(),
        }
        res = requests.post(
            f"{SERVER_URL}/devices/heartbeat",
            json=data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        if res.status_code == 403:
            reason = res.json().get("reason", "unknown")
            print(f"[BLOCKED] This device has been blocked by the admin. Reason: {reason}")
            exit(1)
        print(f"[{time.strftime('%H:%M:%S')}] heartbeat sent — status: {res.status_code}")
        return res.status_code
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] error: {e}")
        return None

if __name__ == "__main__":
    print("SecureSync Endpoint Agent started")
    token = login()
    if not token:
        print("Could not authenticate. Exiting.")
        exit(1)

    while True:
        status = send_heartbeat(token)
        if status == 401:
            print("Token expired — re-authenticating...")
            token = login()
        time.sleep(INTERVAL)