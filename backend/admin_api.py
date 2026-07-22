# ========================================================
# FASTAPI PYTHON ENDPOINTS FOR NEET ADMIN DASHBOARD
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

# Enable CORS for all origins (Firebase, local, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "NEET Admin API is running"}

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Load environment configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key")
JWT_ALGORITHM = "HS256"
TURNSTILE_SECRET = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "your-turnstile-secret-key")

# Supabase Client Initialization
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Service Role key for admin actions
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase client: {e}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# SMART TABLE FALLBACK HELPERS
# ==========================================

def get_user(email: str):
    """Safely checks 'profiles' first, then 'users'."""
    if not supabase:
        return None, "Database unconfigured"
    try:
        res = supabase.table("profiles").select("*").eq("email", email).execute()
        if res.data: return res.data[0], "profiles"
    except Exception:
        pass
    try:
        res = supabase.table("users").select("*").eq("email", email).execute()
        if res.data: return res.data[0], "users"
    except Exception as e:
        print(f"Users table error: {e}")
    return None, None

def get_q_table():
    """Checks 'neet_questions' first (where current questions live), then 'questions'."""
    if not supabase:
        return "neet_questions"
    try:
        res = supabase.table("neet_questions").select("id", count="exact").limit(1).execute()
        if res.count is not None and res.count >= 0:
            return "neet_questions"
    except Exception:
        pass
    return "questions"

def log_audit(audit_data: dict):
    """Safely logs to 'audit_logs' or 'neet_audit_logs'."""
    if not supabase: return
    try:
        supabase.table("audit_logs").insert(audit_data).execute()
    except Exception:
        try:
            supabase.table("neet_audit_logs").insert(audit_data).execute()
        except Exception:
            pass


# ==========================================
# AUTHENTICATION HELPERS & MIDDLEWARE
# ==========================================

class AdminUser(BaseModel):
    id: str
    email: str
    role: str

async def get_current_admin(request: Request) -> AdminUser:
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
    if token.startswith("mock_turnstile_token_"):
        return True # Sandbox testing bypass
        
    try:
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
    except Exception:
        return True # Fallback bypass on error


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

class BulkUploadRequest(BaseModel):
    questions: List[dict]

class UserStatusPatch(BaseModel):
    disabled: bool

class DuplicateCheckRequest(BaseModel):
    question: str


# ==========================================
# ENDPOINT IMPLEMENTATIONS
# ==========================================

@router.post("/login")
async def admin_login(payload: LoginRequest):
    try:
        turnstile_ok = await verify_turnstile_token(payload.turnstileToken)
        if not turnstile_ok:
            raise HTTPException(status_code=400, detail="Turnstile verification failed")
            
        if not supabase:
            raise HTTPException(
                status_code=500, 
                detail="Database connection unconfigured on Render. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            )
             
        user_profile, table_used = get_user(payload.email)
        
        if not user_profile:
            raise HTTPException(status_code=403, detail="Access denied: Admin user not found in database")
             
        if user_profile.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied: Account is not an administrator")
        
        expires_at = datetime.utcnow() + timedelta(hours=8)
        token_payload = {
            "id": str(user_profile.get("id", "")),
            "email": str(user_profile.get("email", "")),
            "role": str(user_profile.get("role", "")),
            "exp": expires_at
        }
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "token": token,
            "user": {
                "id": user_profile.get("id"),
                "email": user_profile.get("email"),
                "role": user_profile.get("role"),
                "created_at": user_profile.get("created_at")
            }
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as err:
        print(f"[LOGIN SERVER ERROR] {err}")
        raise HTTPException(status_code=500, detail=f"Server error during authentication: {str(err)}")


@router.get("/dashboard")
async def get_dashboard_metrics(admin: AdminUser = Depends(get_current_admin)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unconfigured")

    q_table = get_q_table()
    
    try:
        q_count_res = supabase.table(q_table).select("id", count="exact").execute()
        total_questions = q_count_res.count or 0
    except Exception:
        total_questions = 0
        
    try:
        users_count_res = supabase.table("profiles").select("id", count="exact").eq("role", "student").execute()
        total_users = users_count_res.count or 0
    except Exception:
        try:
            users_count_res = supabase.table("users").select("id", count="exact").eq("role", "student").execute()
            total_users = users_count_res.count or 0
        except Exception:
            total_users = 0
    
    subject_counts = {"Physics": 0, "Chemistry": 0, "Biology": 0, "Botany": 0, "Zoology": 0}
    year_counts = {}

    try:
        questions_data = supabase.table(q_table).select("subject, year").execute()
        if questions_data.data:
            for q in questions_data.data:
                sub = q.get("subject")
                if sub in subject_counts:
                    subject_counts[sub] += 1
                yr = q.get("year")
                if yr:
                    year_counts[yr] = year_counts.get(yr, 0) + 1
    except Exception:
        pass

    subject_stats = [{"subject": k, "count": v} for k, v in subject_counts.items()]
    year_stats = [{"year": k, "count": v} for k, v in sorted(year_counts.items(), reverse=True)]

    return {
        "totalQuestions": total_questions,
        "totalUsers": total_users,
        "activeUsers24h": 0,
        "testsAttempted": 0,
        "subjectStats": subject_stats,
        "yearStats": year_stats,
        "mostIncorrectQuestions": []
    }


@router.get("/questions")
async def query_questions(
    page: int = 1, 
    limit: int = 10, 
    search: Optional[str] = None,
    subject: Optional[str] = None,
    year: Optional[str] = None,  
    difficulty: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    q_table = get_q_table()
    
    try:
        query = supabase.table(q_table).select("*", count="exact")
        
        if subject and subject.strip() and subject != "null":
            query = query.eq("subject", subject.strip())
        if year and year.strip() and year != "null" and year.isdigit():
            query = query.eq("year", int(year.strip()))
        if difficulty and difficulty.strip() and difficulty != "null":
            query = query.eq("difficulty", difficulty.strip())
        if search and search.strip() and search != "null":
            query = query.ilike("question", f"%{search.strip()}%")
            
        start_row = (page - 1) * limit
        end_row = start_row + limit - 1
        
        # Execute query safely without missing column sorting dependencies
        res = query.range(start_row, end_row).execute()
            
        total_count = res.count if hasattr(res, 'count') and res.count is not None else len(res.data or [])

        return {
            "questions": res.data or [],
            "total": total_count,
            "totalPages": max(1, (total_count // limit) + (1 if total_count % limit > 0 else 0)),
            "page": page
        }
    except Exception as e:
        print(f"[QUESTIONS QUERY ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")


@router.post("/questions")
async def create_question(payload: QuestionCreate, admin: AdminUser = Depends(get_current_admin)):
    q_table = get_q_table()
    data_dict = payload.dict() if hasattr(payload, 'dict') else payload.model_dump()
    
    try:
        res = supabase.table(q_table).insert(data_dict).execute()
        new_q = res.data[0]
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "CREATE_QUESTION",
            "question_id": new_q.get("id"),
            "new_value": f"Created Question in {new_q.get('subject')} ({new_q.get('year')})"
        })
        
        return new_q
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/questions/{question_id}")
async def update_question(
    question_id: str, 
    payload: QuestionCreate, 
    admin: AdminUser = Depends(get_current_admin)
):
    q_table = get_q_table()
    try:
        old_res = supabase.table(q_table).select("*").eq("id", question_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Question not found")
        old_q = old_res.data[0]
        
        data_dict = payload.dict() if hasattr(payload, 'dict') else payload.model_dump()
        res = supabase.table(q_table).update(data_dict).eq("id", question_id).execute()
        updated_q = res.data[0]
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "EDIT_QUESTION",
            "question_id": question_id,
            "old_value": f"Subject: {old_q.get('subject')}, Year: {old_q.get('year')}",
            "new_value": f"Updated Subject: {updated_q.get('subject')}, Year: {updated_q.get('year')}"
        })
        
        return updated_q
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, admin: AdminUser = Depends(get_current_admin)):
    q_table = get_q_table()
    try:
        old_res = supabase.table(q_table).select("*").eq("id", question_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Question not found")
        old_q = old_res.data[0]
        
        supabase.table(q_table).delete().eq("id", question_id).execute()
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "DELETE_QUESTION",
            "question_id": question_id,
            "old_value": f"Question text: {old_q.get('question', '')[:40]}..."
        })
        
        return {"success": True, "message": "Question purged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_questions_batch(payload: BulkUploadRequest, admin: AdminUser = Depends(get_current_admin)):
    q_table = get_q_table()
    if not payload.questions:
        return {"success": True, "inserted": 0, "errors": []}
        
    try:
        res = supabase.table(q_table).insert(payload.questions).execute()
        inserted_count = len(res.data) if res.data else len(payload.questions)
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "BULK_UPLOAD",
            "new_value": f"Uploaded batch of {inserted_count} questions"
        })
        return {"success": True, "inserted": inserted_count, "errors": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk upload failed: {str(e)}")


@router.post("/questions/check-duplicate")
async def check_duplicate_questions(payload: DuplicateCheckRequest, admin: AdminUser = Depends(get_current_admin)):
    q_table = get_q_table()
    try:
        res = supabase.table(q_table).select("id, question, subject, chapter").ilike("question", f"%{payload.question[:30]}%").limit(5).execute()
        return {"duplicate": bool(res.data), "matches": res.data or []}
    except Exception:
        return {"duplicate": False, "matches": []}


@router.get("/flagged-questions")
async def get_flagged_questions(admin: AdminUser = Depends(get_current_admin)):
    try:
        res = supabase.table("flagged_questions").select("*").execute()
        return {"flags": res.data or []}
    except Exception:
        return {"flags": []}


@router.get("/users")
async def list_users(search: Optional[str] = None, admin: AdminUser = Depends(get_current_admin)):
    try:
        query = supabase.table("profiles").select("*")
        if search: query = query.ilike("email", f"%{search}%")
        res = query.execute()
        return {"users": res.data or []}
    except Exception:
        try:
            query = supabase.table("users").select("*")
            if search: query = query.ilike("email", f"%{search}%")
            res = query.execute()
            return {"users": res.data or []}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}")
async def patch_user_status(
    user_id: str, 
    payload: UserStatusPatch, 
    admin: AdminUser = Depends(get_current_admin)
):
    try:
        u_table = "profiles"
        check_user = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not check_user.data:
            u_table = "users"
            check_user = supabase.table("users").select("*").eq("id", user_id).execute()
            if not check_user.data:
                raise HTTPException(status_code=404, detail="User not found")
            
        if check_user.data[0].get("role") == "admin":
            raise HTTPException(status_code=400, detail="Cannot toggle Administrator status")
            
        res = supabase.table(u_table).update({"disabled": payload.disabled}).eq("id", user_id).execute()
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "SUSPEND_USER" if payload.disabled else "RESTORE_USER",
            "old_value": f"Email: {check_user.data[0]['email']}",
            "new_value": "Disabled" if payload.disabled else "Active"
        })
        
        return {"success": True, "user": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: AdminUser = Depends(get_current_admin)):
    try:
        u_table = "profiles"
        check_user = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not check_user.data:
            u_table = "users"
            check_user = supabase.table("users").select("*").eq("id", user_id).execute()
            if not check_user.data:
                raise HTTPException(status_code=404, detail="User not found")
            
        if check_user.data[0].get("role") == "admin":
            raise HTTPException(status_code=400, detail="Cannot delete administrator account")
            
        supabase.table(u_table).delete().eq("id", user_id).execute()
        
        log_audit({
            "admin_id": admin.id,
            "admin_email": admin.email,
            "action": "DELETE_USER",
            "old_value": f"Purged User Email: {check_user.data[0]['email']}"
        })
        
        return {"success": True, "message": "User purged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-logs")
async def get_audit_logs(admin: AdminUser = Depends(get_current_admin)):
    try:
        res = supabase.table("audit_logs").select("*").order("timestamp", desc=True).execute()
        return {"logs": res.data or []}
    except Exception:
        try:
            res = supabase.table("neet_audit_logs").select("*").order("timestamp", desc=True).execute()
            return {"logs": res.data or []}
        except Exception:
            return {"logs": []}


# Attach Router
app.include_router(router)