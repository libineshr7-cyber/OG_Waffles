"""
OG Waffles POS - Direct Render Deploy & Verification Script
This script allows you to trigger and test your Render deployment directly from Python code.
"""

import os
import sys
import json
import urllib.request
import urllib.error

# Your MongoDB Atlas URI
MONGODB_URI = "mongodb+srv://ogadmin:1973madesh@cluster0.neydyjx.mongodb.net/og_waffles?retryWrites=true&w=majority&appName=Cluster0"

def test_live_render_backend(render_url: str):
    """Test connection to your deployed Render backend directly from code."""
    url = render_url.rstrip("/") + "/api/health"
    print(f"--> Pinging Render backend at: {url}")
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OG-Waffles-Client/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            data = json.loads(body)
            print(f"✅ Response ({status_code}): {data}")
            if data.get("status") == "healthy":
                print("\n🎉 Backend is successfully online on Render and connected to MongoDB Atlas!")
            return data
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.reason}")
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e.reason}")
    except Exception as e:
        print(f"❌ Error: {e}")
    return None

def trigger_render_deploy_hook(deploy_hook_url: str):
    """Trigger deployment directly via Render Deploy Hook URL."""
    print(f"--> Triggering Render Deploy Hook: {deploy_hook_url}")
    try:
        req = urllib.request.Request(deploy_hook_url, method="POST", headers={"User-Agent": "OG-Waffles-Deployer/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            print(f"✅ Deploy triggered successfully! Status code: {response.getcode()}")
            return True
    except Exception as e:
        print(f"❌ Failed to trigger deploy hook: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if "api.render.com/deploy" in target:
            trigger_render_deploy_hook(target)
        else:
            test_live_render_backend(target)
    else:
        print("Usage:")
        print("  1. Test Live Render URL:     python deploy_to_render.py https://og-waffles-backend.onrender.com")
        print("  2. Trigger Deploy Hook:      python deploy_to_render.py https://api.render.com/deploy/srv-xxx?key=yyy")
