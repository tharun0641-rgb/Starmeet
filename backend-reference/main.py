"""
StarMeet — Production Python FastAPI & Socket.IO Signaling Server
Provides JWT Auth, WebRTC Signaling Server, PostgreSQL User & Meeting History Persistence,
Redis Session Caching, and Meeting Quality Feedback Analytics API.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import socketio
import jwt
import hashlib
import os
import time

SECRET_KEY = os.getenv("JWT_SECRET", "starmeet_super_secret_jwt_key_2026")
ALGORITHM = "HS256"

app = FastAPI(title="StarMeet Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO Async Server for Signaling
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio, app)

# In-memory storage for rooms & feedback (in production linked to Postgres & Redis)
ROOMS = {}
FEEDBACK_DB = []
USER_DB = {}

class UserRegisterSchema(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    avatarUrl: Optional[str] = None

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class FeedbackSchema(BaseModel):
    meetingId: str
    userEmail: str
    userName: str
    rating: int
    comment: Optional[str] = ""

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/auth/register")
async def register(user: UserRegisterSchema):
    if user.email in USER_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user.password)
    user_record = {
        "fullName": user.fullName,
        "email": user.email,
        "password": hashed_pwd,
        "avatar": user.avatarUrl or "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.fullName,
        "createdAt": time.time()
    }
    USER_DB[user.email] = user_record
    
    token = jwt.encode({"sub": user.email, "name": user.fullName, "exp": int(time.time()) + 86400}, SECRET_KEY, algorithm=ALGORITHM)
    return {"user": user_record, "token": token}

@app.post("/api/auth/login")
async def login(credentials: UserLoginSchema):
    user = USER_DB.get(credentials.email)
    if not user or user["password"] != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = jwt.encode({"sub": user["email"], "name": user["fullName"], "exp": int(time.time()) + 86400}, SECRET_KEY, algorithm=ALGORITHM)
    return {"user": user, "token": token}

@app.post("/api/feedback")
async def submit_feedback(fb: FeedbackSchema):
    # Prevent duplicates
    for existing in FEEDBACK_DB:
        if existing["meetingId"] == fb.meetingId and existing["userEmail"] == fb.userEmail:
            raise HTTPException(status_code=400, detail="Feedback already submitted for this meeting.")
    
    fb_dict = fb.dict()
    fb_dict["timestamp"] = time.time()
    FEEDBACK_DB.append(fb_dict)
    return {"status": "success", "feedback": fb_dict}

@app.get("/api/feedback/analytics")
async def get_analytics():
    if not FEEDBACK_DB:
        return {"avgRating": 0.0, "totalFeedback": 0, "distribution": {1:0, 2:0, 3:0, 4:0, 5:0}, "recentComments": []}
    
    total = len(FEEDBACK_DB)
    avg = round(sum(f["rating"] for f in FEEDBACK_DB) / total, 1)
    dist = {1:0, 2:0, 3:0, 4:0, 5:0}
    for f in FEEDBACK_DB:
        dist[f["rating"]] = dist.get(f["rating"], 0) + 1
        
    recent = sorted([f for f in FEEDBACK_DB if f["comment"]], key=lambda x: x["timestamp"], reverse=True)[:10]
    return {"avgRating": avg, "totalFeedback": total, "distribution": dist, "recentComments": recent}

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def join_room(sid, data):
    room_id = data.get("roomId")
    user_name = data.get("userName", "Participant")
    await sio.enter_room(sid, room_id)
    await sio.emit("user_joined", {"sid": sid, "userName": user_name}, room=room_id, skip_sid=sid)

@sio.event
async def signal(sid, data):
    target_sid = data.get("targetSid")
    await sio.emit("signal", data, to=target_sid)

@sio.event
async def chat_message(sid, data):
    room_id = data.get("roomId")
    await sio.emit("chat_message", data, room=room_id)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
