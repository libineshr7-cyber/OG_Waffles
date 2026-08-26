import os
import uuid
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from app.database import get_db

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

repo_root = Path(__file__).resolve().parent.parent.parent
upload_dirs = [
    repo_root / "assets" / "uploads",
    repo_root / "og_waffles_pos_new" / "assets" / "uploads"
]

for d in upload_dirs:
    try:
        d.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass


@router.post("", summary="Upload Image File")
async def upload_image(
    file: UploadFile = File(...),
    request: Request = None,
    db = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    ext = Path(file.filename).suffix.lower()
    if not ext or ext not in ALLOWED_EXTENSIONS:
        if file.content_type == "image/png":
            ext = ".png"
        elif file.content_type in ["image/jpeg", "image/jpg"]:
            ext = ".jpg"
        elif file.content_type == "image/webp":
            ext = ".webp"
        elif file.content_type == "image/gif":
            ext = ".gif"
        elif file.content_type == "image/svg+xml":
            ext = ".svg"
        else:
            ext = ".jpg"

    unique_name = f"img_{int(time.time())}_{uuid.uuid4().hex[:8]}{ext}"

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (maximum 15MB)")

    for d in upload_dirs:
        try:
            d.mkdir(parents=True, exist_ok=True)
            file_path = d / unique_name
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            print(f"[Upload] Notice writing to {d}: {e}")

    relative_url = f"assets/uploads/{unique_name}"
    return {
        "success": True,
        "url": relative_url,
        "filename": unique_name
    }
