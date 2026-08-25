import os
import logging
from datetime import date, datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from app.config import settings

logger = logging.getLogger("og_waffles.database")

# Ensure reliable DNS resolution for MongoDB Atlas SRV records
try:
    import dns.resolver
    resolver = dns.resolver.Resolver(configure=True)
    if not resolver.nameservers:
        resolver.nameservers = ['8.8.8.8', '1.1.1.1']
    else:
        resolver.nameservers = list(set(resolver.nameservers + ['8.8.8.8', '1.1.1.1']))
    dns.resolver.default_resolver = resolver
except Exception as dns_e:
    logger.debug(f"DNS resolver configuration notice: {dns_e}")

# Initialize MongoClient with connection pooling and timeouts
client = None
db = None

try:
    client = MongoClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        socketTimeoutMS=20000,
        maxPoolSize=50,
        minPoolSize=5,
        retryWrites=True
    )
    db = client[settings.MONGODB_DB_NAME]
    logger.info(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB at {settings.MONGODB_URI}: {e}")


def get_db():
    """Dependency for FastAPI route handlers to obtain MongoDB database instance."""
    global db
    if db is None:
        client_inst = MongoClient(settings.MONGODB_URI)
        db = client_inst[settings.MONGODB_DB_NAME]
    return db


def to_bson_datetime(val):
    """Converts date or string to BSON-serializable datetime."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    if isinstance(val, date):
        return datetime.combine(val, datetime.min.time())
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val)
        except Exception:
            return val
    return val


def clean_doc(doc):
    """Clean MongoDB document for Pydantic schema serialization."""
    if not doc:
        return None
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        del doc_copy["_id"]
    for k, v in list(doc_copy.items()):
        if isinstance(v, datetime) and (k.endswith("_date") or k == "date"):
            doc_copy[k] = v.date()
        elif isinstance(v, str) and (k.endswith("_date") or k == "date"):
            try:
                if len(v) == 10 and v[4] == '-' and v[7] == '-':
                    doc_copy[k] = date.fromisoformat(v)
            except Exception:
                pass
    return doc_copy


def clean_docs(cursor_or_list):
    """Clean a list or cursor of MongoDB documents."""
    return [clean_doc(d) for d in cursor_or_list]


def init_indexes():
    """Create essential MongoDB indexes for performance and data integrity."""
    database = get_db()
    try:
        database["users"].create_index([("username", ASCENDING)], unique=True)
        database["categories"].create_index([("id", ASCENDING)], unique=True)
        database["categories"].create_index([("name", ASCENDING)], unique=True)
        database["products"].create_index([("id", ASCENDING)], unique=True)
        database["products"].create_index([("category_id", ASCENDING)])
        database["inventory_products"].create_index([("id", ASCENDING)], unique=True)
        database["inventory_products"].create_index([("name", ASCENDING)], unique=True)
        database["suppliers"].create_index([("id", ASCENDING)], unique=True)
        database["suppliers"].create_index([("name", ASCENDING)], unique=True)
        database["purchases"].create_index([("id", ASCENDING)], unique=True)
        database["purchases"].create_index([("purchase_date", DESCENDING)])
        database["sales"].create_index([("id", ASCENDING)], unique=True)
        database["sales"].create_index([("invoice_number", ASCENDING)], unique=True)
        database["sales"].create_index([("sale_date", DESCENDING)])
        database["sales"].create_index([("customer_id", ASCENDING)])
        database["customers"].create_index([("id", ASCENDING)], unique=True)
        database["customers"].create_index([("phone", ASCENDING)])
        database["expenses"].create_index([("id", ASCENDING)], unique=True)
        database["expenses"].create_index([("expense_date", DESCENDING)])
        database["stock_movements"].create_index([("inventory_product_id", ASCENDING)])
        database["stock_movements"].create_index([("created_at", DESCENDING)])
        logger.info("MongoDB indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Index initialization notice: {e}")
