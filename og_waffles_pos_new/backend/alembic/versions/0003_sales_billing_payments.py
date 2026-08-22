"""Add sales, sale_items, and payments tables

Revision ID: 0003_sales_billing_payments
Revises: 0002_inventory_purchases_movements
Create Date: 2026-08-19 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0003_sales_billing_payments'
down_revision = '0002_inventory_purchases_movements'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. sales table
    op.create_table(
        'sales',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('invoice_number', sa.String(length=100), nullable=False),
        sa.Column('customer_id', sa.String(length=100), nullable=True),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('discount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('tax', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('payment_status', sa.String(length=50), nullable=False, server_default='PAID'),
        sa.Column('sale_status', sa.String(length=50), nullable=False, server_default='COMPLETED'),
        sa.Column('sale_date', sa.Date(), nullable=False),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_sales_invoice_number', 'sales', ['invoice_number'], unique=True)
    op.create_index('ix_sales_customer_id', 'sales', ['customer_id'])
    op.create_index('ix_sales_sale_date', 'sales', ['sale_date'])
    op.create_index('ix_sales_created_at', 'sales', ['created_at'])

    # 2. sale_items table
    op.create_table(
        'sale_items',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('sale_id', sa.String(length=100), sa.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', sa.String(length=100), sa.ForeignKey('products.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('product_name_snapshot', sa.String(length=150), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('selling_unit', sa.String(length=50), nullable=False, server_default='piece'),
        sa.Column('deduction_qty', sa.Numeric(precision=10, scale=4), nullable=False, server_default='0.0'),
        sa.Column('inventory_product_id', sa.String(length=100), sa.ForeignKey('inventory_products.id', ondelete='SET NULL'), nullable=True),
        sa.Column('line_discount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('line_tax', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('line_total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_sale_items_sale_id', 'sale_items', ['sale_id'])
    op.create_index('ix_sale_items_product_id', 'sale_items', ['product_id'])
    op.create_index('ix_sale_items_inventory_product_id', 'sale_items', ['inventory_product_id'])

    # 3. payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('sale_id', sa.String(length=100), sa.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_payments_sale_id', 'payments', ['sale_id'])


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('sale_items')
    op.drop_table('sales')
