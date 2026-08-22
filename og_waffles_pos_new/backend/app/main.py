from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "OG Waffles POS API",
        "version": "5.0.0",
        "database": "mongodb",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }
