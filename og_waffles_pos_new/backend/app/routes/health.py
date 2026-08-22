from fastapi import APIRouter, Depends
from app.database import get_db

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
def health_check(db = Depends(get_db)):
    mongo_status = "connected"
    try:
        db.command("ping")
    except Exception as e:
        mongo_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "og-waffles-pos-backend",
        "database": "mongodb",
        "mongo_status": mongo_status
    }
