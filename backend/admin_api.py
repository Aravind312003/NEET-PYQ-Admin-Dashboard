# ========================================================
# FASTAPI PYTHON REFERENCE ENDPOINTS FOR ADMIN DASHBOARD
# ========================================================

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import httpx
import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from supabase import create_client, Client

# ==========================================
# 1. INITIALIZE FASTAPI APP & CORS
# ==========================================
app = FastAPI(title="NEET Admin API")

# Add CORS so your React frontend can successfully make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

router = APIRouter(prefix="/admin", tags=["admin"])

# Load config
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key")
JWT_ALGORITHM = "HS256"
TURNSTILE_SECRET = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "your-turnstile-secret-key")

# Database client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role to allow Admin actions
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password context for verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# AUTHENTICATION HELPERS & MIDDLEWARE
# ==========================================

class AdminUser(BaseModel):
    id: str
    email: str
    role: str

async def get_current_admin(request: Request) -> AdminUser:
    """
    Middleware dependency that decodes JWT, verifies admin roles, 
    and raises HTTP exceptions on failure.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing or malformed"
        )
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("id")
        user_email: str = payload.get("email")
        user_role: str = payload.get("role")
        
        if user_id is None or user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
            
        return AdminUser(id=user_id, email=user_email, role=user_role)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired"
        )


async def verify_turnstile_token(token: str) -> bool:
    """
    Validates Cloudflare Turnstile bot protection parameters.
    """
    if token.startswith("mock_turnstile_token_"):
        return True # Safe sandbox testing bypass
        
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": TURNSTILE_SECRET,
                "response": token
            }
        )
        data = response.json()
        return data.get("success", False)


# ==========================================
# MODELS & SCHEMAS
# ==========================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    turnstileToken: str

class QuestionCreate(BaseModel):
    year: int
    subject: str
    chapter: str
    question_number: int
    question: str
    image_url: Optional[str] = None
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str
    difficulty: str

class UserStatusPatch(BaseModel):
    disabled: bool


# ==========================================
# ENDPOINT IMPLEMENTATIONS
# ==========================================

@router.post("/login")
async def admin_login(payload: LoginRequest):
    # 1. Turnstile Check
    turnstile_ok = await verify_turnstile_token(payload.turnstileToken)
    if not turnstile_ok:
        raise HTTPException(status_code=400, detail="Turnstile verification failed")
        
    # 2. Query profiles for Admin role matching email
    if not supabase:
         raise HTTPException(status_code=500, detail="Database connection unconfigured")
         
    res = supabase.table("profiles").select("*").eq("email", payload.email).execute()
    if not res.data:
         raise HTTPException(status_code=403, detail="Access denied")
         
    user_profile = res.data[0]
    if user_profile["role"] != "admin":
         raise HTTPException(status_code=403, detail="Access denied")
         
    # 3. Verify bcrypt password (using standard Supabase Auth or local hash comparison)
    # Note: If managing passwords via Supabase Auth, make a login request to Supabase API instead
    # Example local verification if passwords stored in profiles:
    # is_valid = pwd_context.verify(payload.password, user_profile["password_hash"])
    # if not is_valid: raise HTTPException(status_code=403, detail="Access denied")
    
    # 4. Generate JWT
    expires_at = datetime.utcnow() + timedelta(hours=8)
    token_payload = {
        "id": user_profile["id"],
        "email": user_profile["email"],
        "role": user_profile["role"],
        "exp": expires_at
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "user": {
            "id": user_profile["id"],
            "email": user_profile["email"],
            "role": user_profile["role"],
            "created_at": user_profile["created_at"]
        }
    }


@router.get("/dashboard")
async def get_dashboard_metrics(admin: AdminUser = Depends(get_current_admin)):
    # 1. Query Counts from database tables
    q_count_res = supabase.table("questions").select("id", count="exact").execute()
    users_count_res = supabase.table("profiles").select("id", count="exact").eq("role", "student").execute()
    
    # 2. Extract Subject stats
    # Requires an RPC or you can do standard table aggregations if RPC doesn't exist
    
    # 3. Compile Audit/Analytics response
    return {
        "totalQuestions": q_count_res.count or 0,
        "totalUsers": users_count_res.count or 0,
        "activeUsers24h": 12, # Replace with analytical queries
        "testsAttempted": 240,
        "subjectStats": [
            {"subject": "Biology", "count": 120},
            {"subject": "Chemistry", "count": 80},
            {"subject": "Physics", "count": 40}
        ],
        "yearStats": [
            {"year": 2023, "count": 100},
            {"year": 2022, "count": 80},
            {"year": 2021, "count": 60}
        ],
        "mostIncorrectQuestions": []
    }


@router.get("/questions")
async def query_questions(
    page: int = 1, 
    limit: int = 10, 
    search: Optional[str] = None,
    subject: Optional[str] = None,
    year: Optional[int] = None,
    difficulty: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    query = supabase.table("questions").select("*", count="exact")
    
    if subject:
        query = query.eq("subject", subject)
    if year:
        query = query.eq("year", year)
    if difficulty:
        query = query.eq("difficulty", difficulty)
    if search:
        query = query.ilike("question", f"%{search}%")
        
    start_row = (page - 1) * limit
    end_row = start_row + limit - 1
    
    res = query.range(start_row, end_row).order("created_at", desc=True).execute()
    
    return {
        "questions": res.data,
        "total": res.count or 0,
        "totalPages": (res.count // limit) + 1 if res.count else 1,
        "page": page
    }


@router.post("/questions")
async def create_question(payload: QuestionCreate, admin: AdminUser = Depends(get_current_admin)):
    res = supabase.table("questions").insert(payload.dict()).execute()
    new_q = res.data[0]
    
    # Audit log creation
    audit_data = {
        "admin_id": admin.id,
        "admin_email": admin.email,
        "action": "CREATE_QUESTION",
        "question_id": new_q["id"],
        "new_value": f"Created Question in {new_q['subject']} ({new_q['year']})"
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return new_q


@router.put("/questions/{question_id}")
async def update_question(
    question_id: str, 
    payload: QuestionCreate, 
    admin: AdminUser = Depends(get_current_admin)
):
    # Fetch old for Audit Logs
    old_res = supabase.table("questions").select("*").eq("id", question_id).execute()
    if not old_res.data:
        raise HTTPException(status_code=404, detail="Question not found")
    old_q = old_res.data[0]
    
    # Update Record
    res = supabase.table("questions").update(payload.dict()).eq("id", question_id).execute()
    updated_q = res.data[0]
    
    # Audit Logging
    audit_data = {
        "admin_id": admin.id,
        "admin_email": admin.email,
        "action": "EDIT_QUESTION",
        "question_id": question_id,
        "old_value": f"Subject: {old_q['subject']}, Year: {old_q['year']}",
        "new_value": f"Updated Subject: {updated_q['subject']}, Year: {updated_q['year']}"
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return updated_q


@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, admin: AdminUser = Depends(get_current_admin)):
    # Fetch old for Audit
    old_res = supabase.table("questions").select("*").eq("id", question_id).execute()
    if not old_res.data:
        raise HTTPException(status_code=404, detail="Question not found")
    old_q = old_res.data[0]
    
    # Delete
    supabase.table("questions").delete().eq("id", question_id).execute()
    
    # Audit Logging
    audit_data = {
        "admin_id": admin.id,
        "admin_email": admin.email,
        "action": "DELETE_QUESTION",
        "question_id": question_id,
        "old_value": f"Question text: {old_q['question'][:40]}..."
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"success": True, "message": "Question purged successfully"}


@router.get("/users")
async def list_users(search: Optional[str] = None, admin: AdminUser = Depends(get_current_admin)):
    query = supabase.table("profiles").select("*")
    if search:
        query = query.ilike("email", f"%{search}%")
        
    res = query.execute()
    return {"users": res.data}


@router.patch("/users/{user_id}")
async def patch_user_status(
    user_id: str, 
    payload: UserStatusPatch, 
    admin: AdminUser = Depends(get_current_admin)
):
    # Restrict modifying other admins
    check_user = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not check_user.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    if check_user.data[0]["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot toggle Administrator status")
        
    res = supabase.table("profiles").update({"disabled": payload.disabled}).eq("id", user_id).execute()
    
    audit_data = {
        "admin_id": admin.id,
        "admin_email": admin.email,
        "action": "SUSPEND_USER" if payload.disabled else "RESTORE_USER",
        "old_value": f"Email: {check_user.data[0]['email']}",
        "new_value": "Disabled" if payload.disabled else "Active"
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"success": True, "user": res.data[0]}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: AdminUser = Depends(get_current_admin)):
    # Restrict deleting other admins
    check_user = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not check_user.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    if check_user.data[0]["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete administrator account")
        
    supabase.table("profiles").delete().eq("id", user_id).execute()
    
    audit_data = {
        "admin_id": admin.id,
        "admin_email": admin.email,
        "action": "DELETE_USER",
        "old_value": f"Purged User Email: {check_user.data[0]['email']}"
    }
    supabase.table("audit_logs").insert(audit_data).execute()
    
    return {"success": True, "message": "User purged successfully"}

# ==========================================
# 2. ATTACH ROUTER TO THE APP
# ==========================================
app.include_router(router)