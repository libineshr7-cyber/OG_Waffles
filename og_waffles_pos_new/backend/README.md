# OG Waffles POS — Backend API (V1 Foundation)

FastAPI & SQLAlchemy backend foundation for OG Waffles & Fried Chicken POS/ERP.

## Features
- **FastAPI** REST API with automatic OpenAPI /docs documentation.
- **SQLAlchemy 2.0** ORM for PostgreSQL.
- **Alembic** database migrations.
- **JWT & Bcrypt** secure authentication.
- **Role-Based Access Control (RBAC)** strictly enforcing OWNER and CASHIER roles (No Manager).
- **Core Entities**: Users, Categories, Products, Inventory Products (with unit conversion), and Suppliers.

## Getting Started

### 1. Configure Environment
Copy .env.example to .env and fill in your PostgreSQL credentials:
`ash
cp .env.example .env
`

### 2. Install Dependencies
`ash
pip install -r requirements.txt
`

### 3. Run Database Migrations
`ash
alembic upgrade head
`

### 4. Seed Development Users
`ash
python seed.py
`
This creates:
- owner_dev (Role: OWNER)
- cashier_dev (Role: CASHIER)

### 5. Run the Server
`ash
uvicorn app.main:app --reload --port 8001
`

Access Swagger UI documentation at: http://localhost:8001/docs
