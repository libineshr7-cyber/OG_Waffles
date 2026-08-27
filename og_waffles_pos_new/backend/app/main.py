import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_indexes
from app.config import settings
from app.routes import (
    health_router,
    auth_router,
    categories_router,
    products_router,
    inventory_router,
    suppliers_router,
    purchases_router,
    sales_router,
    customers_router,
    expenses_router,
    reports_router,
    dashboard_router,
    upload_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize indexes and auto-seed if enabled
    try:
        init_indexes()
        if settings.AUTO_SEED:
            from seed_master_data import seed_master_data
            seed_master_data()
    except Exception as e:
        print(f"[OG Waffles] Startup notice: {e}")
    yield


app = FastAPI(
    title="OG Waffles POS Backend API",
    description="Authoritative MongoDB REST API for OG Waffles & Fried Chicken POS & ERP System.",
    version="5.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Security hardening headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Content Security Policy configured for POS CDNs & APIs
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
            "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https: http:; "
            "frame-ancestors 'self';"
        )
        response.headers["Content-Security-Policy"] = csp
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(suppliers_router)
app.include_router(purchases_router)
app.include_router(sales_router)
app.include_router(customers_router)
app.include_router(expenses_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(upload_router)


# ── Frontend Static Files Mounting ──
current_path = Path(__file__).resolve()
candidate_roots = [
    current_path.parent.parent.parent.parent,  # Workspace root (D:\OG_Waffles)
    current_path.parent.parent.parent,         # og_waffles_pos_new
    current_path.parent.parent,                # backend
    Path.cwd()
]

frontend_dir = None
for root in candidate_roots:
    if (root / "index.html").exists():
        frontend_dir = root
        break
    if (root / "og_waffles_pos_new" / "index.html").exists():
        frontend_dir = root / "og_waffles_pos_new"
        break

if not frontend_dir:
    frontend_dir = Path.cwd()

css_dir = frontend_dir / "css"
js_dir = frontend_dir / "js"
assets_dir = frontend_dir / "assets"

if css_dir.exists():
    app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
if js_dir.exists():
    app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/app", tags=["Frontend"])
@app.get("/pos", tags=["Frontend"])
def serve_web_pos():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"error": "Frontend index.html not found"}


@app.get("/", tags=["Root"])
def root():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "app": "OG Waffles POS API",
        "version": "5.0.0",
        "database": "mongodb",
        "status": "online",
        "web_pos": "/app",
        "docs": "/docs",
        "health": "/api/health"
    }
