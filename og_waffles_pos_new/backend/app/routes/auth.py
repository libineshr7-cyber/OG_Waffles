import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.database import get_db, clean_doc
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory Rate Limiter for Login Brute Force Defense (Free Security)
# Key: client identifier -> list of failed timestamp floats
FAILED_LOGIN_ATTEMPTS = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300  # 5 minutes


@router.post("/login", response_model=TokenResponse, summary="User Login (Owner or Cashier)")
def login(login_data: LoginRequest, request: Request, db = Depends(get_db)):
    client_ip = "unknown"
    if request.client and request.client.host:
        client_ip = request.client.host
    # Include forwarded IP if behind proxy/Render
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    attempt_key = f"{client_ip}:{login_data.username.strip().lower()}"
    now = time.time()

    # Clean expired failure records outside the lockout window
    FAILED_LOGIN_ATTEMPTS[attempt_key] = [
        t for t in FAILED_LOGIN_ATTEMPTS[attempt_key] if now - t < LOCKOUT_WINDOW_SECONDS
    ]

    # Check if currently locked out
    if len(FAILED_LOGIN_ATTEMPTS[attempt_key]) >= MAX_FAILED_ATTEMPTS:
        first_fail = FAILED_LOGIN_ATTEMPTS[attempt_key][0]
        retry_after = max(1, int(LOCKOUT_WINDOW_SECONDS - (now - first_fail)))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Locked for security. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

    user = db["users"].find_one({"username": login_data.username.strip()})
    if not user or not verify_password(login_data.password, user.get("password_hash", "")):
        # Record failed attempt
        FAILED_LOGIN_ATTEMPTS[attempt_key].append(now)
        remaining = MAX_FAILED_ATTEMPTS - len(FAILED_LOGIN_ATTEMPTS[attempt_key])
        msg = f"Invalid username or password. ({remaining} attempt(s) remaining)" if remaining > 0 else "Invalid username or password. Account temporarily locked for 5 minutes."
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg,
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact store owner."
        )

    # Success -> Clear failed attempts for this client/user
    FAILED_LOGIN_ATTEMPTS.pop(attempt_key, None)

    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"],
        "name": user.get("name", user["username"])
    }


@router.get("/me", response_model=UserOut, summary="Get Current Authenticated User Profile")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout", summary="Logout Session")
def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

