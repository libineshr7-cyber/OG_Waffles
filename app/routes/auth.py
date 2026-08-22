from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db, clean_doc
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="User Login (Owner or Cashier)")
def login(login_data: LoginRequest, db = Depends(get_db)):
    user = db["users"].find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

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
