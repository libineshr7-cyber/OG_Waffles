from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from app.schemas.inventory_product import (
    InventoryProductCreate, InventoryProductUpdate, InventoryProductOut,
    InventoryAdjustmentRequest, InventoryWasteRequest
)
from app.schemas.purchase import PurchaseCreate, PurchaseOut, PurchaseItemCreate, PurchaseItemOut
from app.schemas.stock_movement import StockMovementOut
from app.schemas.payment import PaymentCreate, PaymentOut
from app.schemas.sale import (
    SaleCreate, SaleOut, SaleItemCreate, SaleItemOut, CustomerPayload,
    TodaySalesSummary, SalesSummary
)
from app.schemas.reward import (
    RewardVisitCreate, RewardVisitOut, RewardRedeemCreate, RewardRedemptionOut
)
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerOut, CustomerDetailOut
)
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseOut
)
from app.schemas.report import (
    TodayReportOut, SalesReportOut, ProductSalesReportItem, CategorySalesReportItem,
    ExpenseReportOut, PurchaseReportOut, ProfitReportOut, InventoryValuationReportOut,
    DailyTrendItem, TopProductItem, DashboardMetrics
)

__all__ = [
    "LoginRequest", "TokenResponse", "UserOut",
    "CategoryCreate", "CategoryUpdate", "CategoryOut",
    "ProductCreate", "ProductUpdate", "ProductOut",
    "SupplierCreate", "SupplierUpdate", "SupplierOut",
    "InventoryProductCreate", "InventoryProductUpdate", "InventoryProductOut",
    "InventoryAdjustmentRequest", "InventoryWasteRequest",
    "PurchaseCreate", "PurchaseOut", "PurchaseItemCreate", "PurchaseItemOut",
    "StockMovementOut",
    "PaymentCreate", "PaymentOut",
    "SaleCreate", "SaleOut", "SaleItemCreate", "SaleItemOut", "CustomerPayload",
    "TodaySalesSummary", "SalesSummary",
    "RewardVisitCreate", "RewardVisitOut", "RewardRedeemCreate", "RewardRedemptionOut",
    "CustomerCreate", "CustomerUpdate", "CustomerOut", "CustomerDetailOut",
    "ExpenseCreate", "ExpenseUpdate", "ExpenseOut",
    "TodayReportOut", "SalesReportOut", "ProductSalesReportItem", "CategorySalesReportItem",
    "ExpenseReportOut", "PurchaseReportOut", "ProfitReportOut", "InventoryValuationReportOut",
    "DailyTrendItem", "TopProductItem", "DashboardMetrics"
]
