import os
import sys
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import Session, User

router = APIRouter()

# ── Password hashing ───────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# ── JWT config ─────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


# ── Schemas ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    full_name: str
    email: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse)
def signup(request: SignupRequest):
    if not request.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not request.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    session = Session()
    try:
        existing = session.query(User).filter_by(email=request.email.strip().lower()).first()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        user = User(
            full_name=request.full_name.strip(),
            email=request.email.strip().lower(),
            hashed_password=hash_password(request.password),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_token(user.id, user.email)
        return AuthResponse(token=token, full_name=user.full_name, email=user.email)

    finally:
        session.close()


@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    if not request.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if not request.password:
        raise HTTPException(status_code=400, detail="Password is required.")

    session = Session()
    try:
        user = session.query(User).filter_by(email=request.email.strip().lower()).first()

        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password.")

        token = create_token(user.id, user.email)
        return AuthResponse(token=token, full_name=user.full_name, email=user.email)

    finally:
        session.close()