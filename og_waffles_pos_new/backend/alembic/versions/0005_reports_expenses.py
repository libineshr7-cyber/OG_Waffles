"""Add expenses table for V5 reports and analytics

Revision ID: 0005_reports_expenses
Revises: 0004_customers_rewards
Create Date: 2026-08-19 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0005_reports_expenses'
down_revision = '0004_customers_rewards'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. expenses table
    op.create_table(
        'expenses',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='Other'),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='CASH'),
        sa.Column('reference_number', sa.String(length=100), nullable=True, server_default=''),
        sa.Column('notes', sa.Text(), nullable=True, server_default=''),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index('ix_expenses_expense_date', 'expenses', ['expense_date'])
    op.create_index('ix_expenses_category', 'expenses', ['category'])
    op.create_index('ix_expenses_is_deleted', 'expenses', ['is_deleted'])


def downgrade() -> None:
    op.drop_table('expenses')
