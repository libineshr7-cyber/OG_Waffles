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
    dashboard_router
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


# ── Frontend Static Files Mounting ──
repo_root = Path(__file__).resolve().parent.parent
frontend_dir = repo_root / "og_waffles_pos_new"
if not frontend_dir.exists():
    frontend_dir = repo_root

if (frontend_dir / "css").exists():
    app.mount("/css", StaticFiles(directory=str(frontend_dir / "css")), name="css")
if (frontend_dir / "js").exists():
    app.mount("/js", StaticFiles(directory=str(frontend_dir / "js")), name="js")
if (frontend_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dir / "assets")), name="assets")


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
