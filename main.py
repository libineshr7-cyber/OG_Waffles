import os
import sys
import importlib.util

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "og_waffles_pos_new", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Explicitly load the backend FastAPI app module without naming collisions
real_main_path = os.path.join(backend_dir, "app", "main.py")
spec = importlib.util.spec_from_file_location("backend_app_main", real_main_path)
real_main_module = importlib.util.module_from_spec(spec)
sys.modules["backend_app_main"] = real_main_module
spec.loader.exec_module(real_main_module)

app = real_main_module.app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
