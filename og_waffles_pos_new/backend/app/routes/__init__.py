from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.products import router as products_router
from app.routes.inventory import router as inventory_router
from app.routes.suppliers import router as suppliers_router
from app.routes.purchases import router as purchases_router
from app.routes.sales import router as sales_router
from app.routes.customers import router as customers_router
from app.routes.expenses import router as expenses_router
from app.routes.reports import router as reports_router
from app.routes.dashboard import router as dashboard_router

__all__ = [
    "health_router",
    "auth_router",
    "categories_router",
    "products_router",
    "inventory_router",
    "suppliers_router",
    "purchases_router",
    "sales_router",
    "customers_router",
    "expenses_router",
    "reports_router",
    "dashboard_router"
]
