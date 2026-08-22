"""Add customers, reward_visits, and reward_redemptions tables

Revision ID: 0004_customers_rewards
Revises: 0003_sales_billing_payments
Create Date: 2026-08-19 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0004_customers_rewards'
down_revision = '0003_sales_billing_payments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=True, server_default=''),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True, server_default=''),
        sa.Column('notes', sa.Text(), nullable=True, server_default=''),
        sa.Column('total_spent', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('visit_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reward_visits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reward_redemptions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_visit', sa.Date(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_customers_phone', 'customers', ['phone'], unique=True)
    op.create_index('ix_customers_name', 'customers', ['name'])
    op.create_index('ix_customers_is_deleted', 'customers', ['is_deleted'])

    # 2. reward_visits table
    op.create_table(
        'reward_visits',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('customer_id', sa.String(length=100), sa.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sale_id', sa.String(length=100), sa.ForeignKey('sales.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('visit_number', sa.Integer(), nullable=False),
        sa.Column('reward_given', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_reward_visits_customer_id', 'reward_visits', ['customer_id'])
    op.create_index('ix_reward_visits_sale_id', 'reward_visits', ['sale_id'])

    # 3. reward_redemptions table
    op.create_table(
        'reward_redemptions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('customer_id', sa.String(length=100), sa.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reward_name', sa.String(length=150), nullable=False, server_default='Free Waffle / 10 Visits Reward'),
        sa.Column('visit_used', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('notes', sa.Text(), nullable=True, server_default=''),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_reward_redemptions_customer_id', 'reward_redemptions', ['customer_id'])


def downgrade() -> None:
    op.drop_table('reward_redemptions')
    op.drop_table('reward_visits')
    op.drop_table('customers')
