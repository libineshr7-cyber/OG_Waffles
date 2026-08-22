"""Initial tables migration for Users, Categories, Products, Suppliers, and InventoryProducts

Revision ID: 0001_initial_tables
Revises: 
Create Date: 2026-08-19 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='CASHIER'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # 2. categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_categories_name', 'categories', ['name'], unique=True)

    # 3. products table
    op.create_table(
        'products',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('category_id', sa.String(length=100), sa.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('selling_unit', sa.String(length=50), nullable=False, server_default='piece'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('available', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_products_category_id', 'products', ['category_id'])
    op.create_index('ix_products_name', 'products', ['name'])

    # 4. suppliers table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('gst_no', sa.String(length=50), nullable=True),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_suppliers_name', 'suppliers', ['name'], unique=True)

    # 5. inventory_products table
    op.create_table(
        'inventory_products',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='General'),
        sa.Column('purchase_unit', sa.String(length=50), nullable=False, server_default='packet'),
        sa.Column('base_unit', sa.String(length=50), nullable=False, server_default='piece'),
        sa.Column('conversion_qty', sa.Numeric(precision=10, scale=4), nullable=False, server_default='1.0'),
        sa.Column('current_qty', sa.Numeric(precision=12, scale=4), nullable=False, server_default='0.0'),
        sa.Column('min_limit', sa.Numeric(precision=12, scale=4), nullable=False, server_default='10.0'),
        sa.Column('avg_cost', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('supplier_id', sa.String(length=100), sa.ForeignKey('suppliers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Available'),
        sa.Column('last_updated', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_inventory_products_name', 'inventory_products', ['name'], unique=True)
    op.create_index('ix_inventory_products_supplier_id', 'inventory_products', ['supplier_id'])


def downgrade() -> None:
    op.drop_table('inventory_products')
    op.drop_table('suppliers')
    op.drop_table('products')
    op.drop_table('categories')
    op.drop_table('users')
