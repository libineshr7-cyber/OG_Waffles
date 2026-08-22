"""Add purchases, purchase_items, stock_movements tables and link products to inventory

Revision ID: 0002_inventory_purchases_movements
Revises: 0001_initial_tables
Create Date: 2026-08-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_inventory_purchases_movements'
down_revision = '0001_initial_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add columns to products table using batch_alter_table
    with op.batch_alter_table('products') as batch_op:
        batch_op.add_column(sa.Column('inventory_product_id', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('deduction_qty', sa.Numeric(precision=10, scale=4), nullable=True, server_default='0.0'))
        batch_op.create_foreign_key('fk_products_inventory_product_id', 'inventory_products', ['inventory_product_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index('ix_products_inventory_product_id', ['inventory_product_id'])

    # 2. purchases table
    op.create_table(
        'purchases',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('supplier_id', sa.String(length=100), sa.ForeignKey('suppliers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('invoice_number', sa.String(length=100), nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('tax', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('discount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_purchases_supplier_id', 'purchases', ['supplier_id'])
    op.create_index('ix_purchases_invoice_number', 'purchases', ['invoice_number'])

    # 3. purchase_items table
    op.create_table(
        'purchase_items',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('purchase_id', sa.String(length=100), sa.ForeignKey('purchases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('inventory_product_id', sa.String(length=100), sa.ForeignKey('inventory_products.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('purchase_qty', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('purchase_unit', sa.String(length=50), nullable=False),
        sa.Column('conversion_qty', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('base_qty', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_purchase_items_purchase_id', 'purchase_items', ['purchase_id'])
    op.create_index('ix_purchase_items_inventory_product_id', 'purchase_items', ['inventory_product_id'])

    # 4. stock_movements table
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('inventory_product_id', sa.String(length=100), sa.ForeignKey('inventory_products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('movement_type', sa.String(length=50), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('quantity_before', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('quantity_after', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_stock_movements_inventory_product_id', 'stock_movements', ['inventory_product_id'])
    op.create_index('ix_stock_movements_movement_type', 'stock_movements', ['movement_type'])
    op.create_index('ix_stock_movements_created_at', 'stock_movements', ['created_at'])


def downgrade() -> None:
    op.drop_table('stock_movements')
    op.drop_table('purchase_items')
    op.drop_table('purchases')
    with op.batch_alter_table('products') as batch_op:
        batch_op.drop_constraint('fk_products_inventory_product_id', type_='foreignkey')
        batch_op.drop_column('deduction_qty')
        batch_op.drop_column('inventory_product_id')
