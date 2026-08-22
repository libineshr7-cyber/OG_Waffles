import os
import sys

# Ensure backend package is in sys.path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "og_waffles_pos_new", "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import the main FastAPI app from og_waffles_pos_new/backend/app/main.py
from app.main import app
