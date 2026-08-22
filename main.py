import os
import sys

# Add og_waffles_pos_new/backend to Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "og_waffles_pos_new", "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
