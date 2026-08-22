from datetime import date
from pydantic import BaseModel
from typing import Optional, List


class TodayReportOut(BaseModel):
    report_date: date
    number_of_bills: int
    gross_sales: float
    discount_total: float
    tax_total: float
    net_sales: float
    cash_total: float
    upi_total: float
    card_total: float
    total_expenses: float
    net_after_expenses: float


class SalesReportOut(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    number_of_bills: int
    gross_sales: float
    discount_total: float
    tax_total: float
    net_sales: float
    cash_total: float
    upi_total: float
    card_total: float
    cancelled_sales_count: int


class ProductSalesReportItem(BaseModel):
    product_id: str
    product_name: str
    quantity_sold: float
    gross_sales: float
    discount: float
    tax: float
    net_sales: float


class CategorySalesReportItem(BaseModel):
    category_id: str
    category_name: str
    quantity_sold: float
    net_sales: float


class ExpenseCategoryBreakdown(BaseModel):
    category: str
    amount: float
    count: int


class ExpenseReportOut(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    total_expenses: float
    category_breakdown: List[ExpenseCategoryBreakdown] = []


class SupplierPurchaseBreakdown(BaseModel):
    supplier_id: str
    supplier_name: str
    purchase_count: int
    purchase_total: float


class PurchaseReportOut(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    number_of_purchases: int
    total_purchase_cost: float
    supplier_breakdown: List[SupplierPurchaseBreakdown] = []


class ProfitReportOut(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    net_sales: float
    cost_of_goods_sold: float
    gross_profit: float
    expenses: float
    net_profit: float
    profit_margin_percentage: float


class InventoryValuationItem(BaseModel):
    inventory_product_id: str
    product_name: str
    current_qty: float
    base_unit: str
    avg_cost: float
    inventory_value: float


class InventoryValuationReportOut(BaseModel):
    total_inventory_value: float
    items: List[InventoryValuationItem] = []


class DailyTrendItem(BaseModel):
    date: date
    bills: int
    net_sales: float
    expenses: float
    profit: float


class TopProductItem(BaseModel):
    product_id: str
    product_name: str
    quantity_sold: float
    net_sales: float


class DashboardMetrics(BaseModel):
    today: dict
    this_month: dict
    inventory: dict
    customers: dict
    rewards: dict
