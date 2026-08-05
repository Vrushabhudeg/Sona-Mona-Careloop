from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, get_db, Base, SessionLocal
from app.models import models
from app.schemas import schemas
from typing import List, Optional
from uuid import UUID, uuid4
import datetime
import json
import re
import asyncio
from pywebpush import webpush, WebPushException

# VAPID Keys for Web Push Notifications
VAPID_PUBLIC_KEY = "BD0vydkCgyWGPEJ_hqZqIdUuAtPSvf7dpQnemf372NYY2GZI0hxyKDqq1kHoj_a6zOUSnQrSd0v229JAbEkV-bY"
VAPID_PRIVATE_KEY = "d62jotzFIJ73TPzo07W1ZzjIn9ZhF_jI-ctNCLG-kfo"
VAPID_CLAIMS = {
    "sub": "mailto:vrushabh@careloop.app"
}

def send_web_push(subscription_info, data_str):
    try:
        webpush(
            subscription_info=subscription_info,
            data=data_str,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        return True
    except WebPushException as ex:
        print(f"WebPushException sending push: {repr(ex)}")
        return False

def parse_schedule_time_py(time_str: str):
    try:
        cleaned = time_str.strip()
        # Match pattern: optional leading digit, hour:minute, optional space, AM/PM
        match = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", cleaned, re.IGNORECASE)
        if not match:
            match_24 = re.match(r"^(\d{1,2}):(\d{2})$", cleaned)
            if match_24:
                return int(match_24.group(1)), int(match_24.group(2))
            return None
        
        hours = int(match.group(1))
        minutes = int(match.group(2))
        period = match.group(3).upper()
        
        if period == "PM" and hours != 12:
            hours += 12
        elif period == "AM" and hours == 12:
            hours = 0
            
        return hours, minutes
    except Exception:
        return None

def get_current_local_time():
    now = datetime.datetime.now()
    import time as pytime
    # If server is in UTC (like Vercel production), offset to Sona's local time (IST, +5:30)
    if pytime.tzname[0] in ("UTC", "Coordinated Universal Time", "GMT"):
        return now + datetime.timedelta(hours=5, minutes=30)
    return now

def check_active_reminders_and_send(db: Session):
    now = get_current_local_time()
    current_hour = now.hour
    current_minute = now.minute
    
    # We load active reminders
    reminders = db.query(models.Reminder).filter(models.Reminder.is_active == True).all()
    sent_count = 0
    
    for reminder in reminders:
        parsed = parse_schedule_time_py(reminder.schedule_time)
        if not parsed:
            continue
        
        rem_hour, rem_minute = parsed
        if rem_hour == current_hour and rem_minute == current_minute:
            subs = db.query(models.PushSubscription).filter(
                models.PushSubscription.user_id == reminder.user_id
            ).all()
            
            if subs:
                payload = json.dumps({
                    "title": reminder.title,
                    "body": reminder.message or "Time for a sweet check-off! ❤️"
                })
                for sub in subs:
                    sub_info = {
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth
                        }
                    }
                    if send_web_push(sub_info, payload):
                        sent_count += 1
                        
                        # Log sending to history
                        history_log = models.ReminderHistory(
                            id=uuid4(),
                            user_id=reminder.user_id,
                            reminder_id=reminder.id,
                            status="sent",
                            action_time=datetime.datetime.utcnow()
                        )
                        db.add(history_log)
    db.commit()
    return sent_count

async def check_reminders_loop():
    # Wait a bit on startup
    await asyncio.sleep(5)
    while True:
        try:
            db = SessionLocal()
            try:
                check_active_reminders_and_send(db)
            finally:
                db.close()
        except Exception as e:
            print("Error in check_reminders_loop background worker:", e)
        await asyncio.sleep(60)

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def start_background_workers():
    asyncio.create_task(check_reminders_loop())

Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for Vercel in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "message": "CareLoop FastAPI backend is running smoothly ❤️",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )

def ensure_profile_exists(db: Session, user_id: UUID, email: str = None, full_name: str = None):
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not profile:
        role = "user"
        if str(user_id) == "d3b07384-d113-4ec6-a558-7e3077dd7d7b":
            email = "sona@careloop.app"
            full_name = "Sona"
            role = "user"
        elif str(user_id) == "5f8288b8-0c6e-4e4b-b0b3-f6cd64d5ee2c":
            email = "vrushabh@careloop.app"
            full_name = "Vrushabh"
            role = "partner"
        else:
            if not email:
                email = f"user_{str(user_id)}@careloop.app"
            if not full_name:
                full_name = "CareLoop User"
        
        # Check if email is already taken
        existing_email = db.query(models.Profile).filter(models.Profile.email == email).first()
        if existing_email:
            email = f"user_{str(user_id)}_{int(datetime.datetime.utcnow().timestamp())}@careloop.app"
            
        profile = models.Profile(
            id=user_id,
            email=email,
            full_name=full_name,
            role=role
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# --- PUSH NOTIFICATIONS ENDPOINTS ---
@app.post("/api/notifications/subscribe")
def subscribe(payload: schemas.PushSubscriptionCreate, db: Session = Depends(get_db)):
    try:
        ensure_profile_exists(db, payload.user_id)
        # Check if already exists
        existing = db.query(models.PushSubscription).filter(
            models.PushSubscription.endpoint == payload.endpoint
        ).first()
        if existing:
            existing.user_id = payload.user_id
            existing.p256dh = payload.p256dh
            existing.auth = payload.auth
            db.commit()
            db.refresh(existing)
            return existing
        
        db_sub = models.PushSubscription(
            id=uuid4(),
            user_id=payload.user_id,
            endpoint=payload.endpoint,
            p256dh=payload.p256dh,
            auth=payload.auth
        )
        db.add(db_sub)
        db.commit()
        db.refresh(db_sub)
        return db_sub
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notifications/send-test")
def send_test_notification(user_id: UUID, db: Session = Depends(get_db)):
    try:
        subs = db.query(models.PushSubscription).filter(
            models.PushSubscription.user_id == user_id
        ).all()
        
        if not subs:
            raise HTTPException(status_code=404, detail="No active notifications registration found. Please install the app and enable notifications.")
        
        payload = json.dumps({
            "title": "CareLoop Test Nudge ❤️",
            "body": "It works! You are officially synced with Vrushabh's care. 🌸"
        })
        
        sent_count = 0
        for sub in subs:
            sub_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            if send_web_push(sub_info, payload):
                sent_count += 1
                
        return {"status": "success", "message": f"Test nudge sent to {sent_count} device(s)!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cron/check-reminders")
def cron_check_reminders(db: Session = Depends(get_db)):
    try:
        sent_count = check_active_reminders_and_send(db)
        return {"status": "success", "sent_count": sent_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- USER PROFILES ENDPOINTS ---
@app.get("/api/profiles/{user_id}", response_model=schemas.ProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db)):
    try:
        profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
        if not profile:
            # Return placeholder profile to support offline showcases
            return {
                "id": user_id,
                "email": "sarah@careloop.app",
                "full_name": "Sarah Andrews",
                "avatar_url": "",
                "role": "user",
                "created_at": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow()
            }
        return profile
    except Exception:
        # Fallback dictionary
        return {
            "id": user_id,
            "email": "sarah@careloop.app",
            "full_name": "Sarah Andrews",
            "avatar_url": "",
            "role": "user",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }

@app.put("/api/profiles/{user_id}", response_model=schemas.ProfileResponse)
def update_profile(user_id: UUID, data: schemas.ProfileBase, db: Session = Depends(get_db)):
    try:
        profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile.full_name = data.full_name
        profile.avatar_url = data.avatar_url
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ADMIN USER DIRECTORIES ---
@app.get("/api/admin/profiles", response_model=List[schemas.ProfileResponse])
def admin_get_profiles(db: Session = Depends(get_db)):
    try:
        profiles = db.query(models.Profile).all()
        if not profiles:
            # Return mock data list for local design sandboxes
            return [
                {"id": uuid4(), "email": "sarah@careloop.app", "full_name": "Sarah Andrews", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
                {"id": uuid4(), "email": "david@bloom.io", "full_name": "David Miller", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
                {"id": uuid4(), "email": "emily@wellness.com", "full_name": "Emily Watson", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
            ]
        return profiles
    except Exception:
        return [
            {"id": uuid4(), "email": "sarah@careloop.app", "full_name": "Sarah Andrews", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
            {"id": uuid4(), "email": "david@bloom.io", "full_name": "David Miller", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
            {"id": uuid4(), "email": "emily@wellness.com", "full_name": "Emily Watson", "avatar_url": "", "role": "user", "created_at": datetime.datetime.utcnow(), "updated_at": datetime.datetime.utcnow()},
        ]

# --- ADMIN REMINDERS DIRECTORY ---
@app.get("/api/admin/reminders", response_model=List[schemas.ReminderResponse])
def admin_get_all_reminders(db: Session = Depends(get_db)):
    try:
        reminders = db.query(models.Reminder).all()
        return reminders
    except Exception:
        return []


# --- REMINDERS API CRUD ---
@app.get("/api/reminders", response_model=List[schemas.ReminderResponse])
def get_reminders(user_id: UUID, db: Session = Depends(get_db)):
    try:
        reminders = db.query(models.Reminder).filter(models.Reminder.user_id == user_id).all()
        return reminders
    except Exception:
        return []

@app.post("/api/reminders", response_model=schemas.ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(user_id: UUID, reminder: schemas.ReminderCreate, db: Session = Depends(get_db)):
    try:
        ensure_profile_exists(db, user_id)
        db_reminder = models.Reminder(
            id=uuid4(),
            user_id=user_id,
            title=reminder.title,
            message=reminder.message,
            schedule_time=reminder.schedule_time,
            is_active=reminder.is_active
        )
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except Exception as e:
        # Return fallback mockup model
        return {
            "id": uuid4(),
            "user_id": user_id,
            "title": reminder.title,
            "message": reminder.message,
            "schedule_time": reminder.schedule_time,
            "is_active": reminder.is_active,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }

@app.put("/api/reminders/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(reminder_id: UUID, data: schemas.ReminderUpdate, db: Session = Depends(get_db)):
    try:
        db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
        if not db_reminder:
            raise HTTPException(status_code=404, detail="Reminder not found")
        if data.title is not None:
            db_reminder.title = data.title
        if data.message is not None:
            db_reminder.message = data.message
        if data.schedule_time is not None:
            db_reminder.schedule_time = data.schedule_time
        if data.is_active is not None:
            db_reminder.is_active = data.is_active
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reminders/{reminder_id}")
def delete_reminder(reminder_id: UUID, db: Session = Depends(get_db)):
    try:
        db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
        if not db_reminder:
            raise HTTPException(status_code=404, detail="Reminder not found")
        db.delete(db_reminder)
        db.commit()
        return {"status": "success", "message": "Reminder deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- REMINDER EXECUTION HISTORY ---
@app.get("/api/reminders/history", response_model=List[schemas.ReminderHistoryResponse])
def get_reminder_history(user_id: UUID, db: Session = Depends(get_db)):
    try:
        logs = db.query(models.ReminderHistory).filter(models.ReminderHistory.user_id == user_id).all()
        return logs
    except Exception:
        return []

@app.post("/api/reminders/history", response_model=schemas.ReminderHistoryResponse, status_code=status.HTTP_201_CREATED)
def create_history_log(log: schemas.ReminderHistoryCreate, db: Session = Depends(get_db)):
    try:
        ensure_profile_exists(db, log.user_id)
        db_log = models.ReminderHistory(
            id=uuid4(),
            user_id=log.user_id,
            reminder_id=log.reminder_id,
            status=log.status,
            action_time=log.action_time or datetime.datetime.utcnow()
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except Exception:
        return {
            "id": uuid4(),
            "user_id": log.user_id,
            "reminder_id": log.reminder_id,
            "status": log.status,
            "action_time": log.action_time or datetime.datetime.utcnow(),
            "created_at": datetime.datetime.utcnow()
        }

# --- NUTRITION DIET LOGS ---
@app.get("/api/nutrition", response_model=List[schemas.NutritionLogResponse])
def get_nutrition_logs(user_id: UUID, db: Session = Depends(get_db)):
    try:
        logs = db.query(models.NutritionLog).filter(models.NutritionLog.user_id == user_id).all()
        return logs
    except Exception:
        return []

@app.post("/api/nutrition", response_model=schemas.NutritionLogResponse, status_code=status.HTTP_201_CREATED)
def log_nutrition(user_id: UUID, log: schemas.NutritionLogCreate, db: Session = Depends(get_db)):
    try:
        ensure_profile_exists(db, user_id)
        db_log = models.NutritionLog(
            id=uuid4(),
            user_id=user_id,
            meal_type=log.meal_type,
            food_name=log.food_name,
            calories=log.calories,
            protein=log.protein,
            carbs=log.carbs,
            fat=log.fat,
            water_amount=log.water_amount
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except Exception:
        return {
            "id": uuid4(),
            "user_id": user_id,
            "meal_type": log.meal_type,
            "food_name": log.food_name,
            "calories": log.calories,
            "protein": log.protein,
            "carbs": log.carbs,
            "fat": log.fat,
            "water_amount": log.water_amount,
            "logged_at": datetime.datetime.utcnow()
        }

@app.delete("/api/nutrition/{log_id}")
def delete_nutrition_log(log_id: UUID, db: Session = Depends(get_db)):
    try:
        db_log = db.query(models.NutritionLog).filter(models.NutritionLog.id == log_id).first()
        if not db_log:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        db.delete(db_log)
        db.commit()
        return {"status": "success", "message": "Nutrition log deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- REELS API ---
@app.get("/api/reels", response_model=List[schemas.ReelResponse])
def get_reels(db: Session = Depends(get_db)):
    try:
        reels = db.query(models.Reel).order_by(models.Reel.created_at.desc()).all()
        return reels
    except Exception:
        return []

@app.post("/api/reels", response_model=schemas.ReelResponse, status_code=status.HTTP_201_CREATED)
def create_reel(reel: schemas.ReelCreate, db: Session = Depends(get_db)):
    try:
        db_reel = models.Reel(
            id=uuid4(),
            title=reel.title,
            description=reel.description,
            url=reel.url,
            category=reel.category,
            shortcode=reel.shortcode
        )
        db.add(db_reel)
        db.commit()
        db.refresh(db_reel)
        return db_reel
    except Exception as e:
        return {
            "id": uuid4(),
            "title": reel.title,
            "description": reel.description,
            "url": reel.url,
            "category": reel.category,
            "shortcode": reel.shortcode,
            "created_at": datetime.datetime.utcnow()
        }

@app.delete("/api/reels/{reel_id}")
def delete_reel(reel_id: UUID, db: Session = Depends(get_db)):
    try:
        db_reel = db.query(models.Reel).filter(models.Reel.id == reel_id).first()
        if not db_reel:
            raise HTTPException(status_code=404, detail="Reel not found")
        db.delete(db_reel)
        db.commit()
        return {"status": "success", "message": "Reel deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from mangum import Mangum

handler = Mangum(app)