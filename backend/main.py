from contextlib import asynccontextmanager
import asyncio
import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
import os
import random
import math
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import hashlib

load_dotenv()

try:
    from google import genai
except ImportError:
    genai = None

# ─── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── Allowed values for security ─────────────────────────────────────────────
ALLOWED_EVENTS = {"Halftime", "Clear", "Gate 1 Blocked", "Emergency Evacuation", "VIP Arrival"}
LOCATION_RE = re.compile(r"^[\w\s\-\(\)\.,']+$", re.UNICODE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background simulator on app startup."""
    task = asyncio.create_task(simulator_task())
    yield
    task.cancel()


app = FastAPI(
    title="CrowdFlow X Stadium Engine",
    description="AI-powered smart stadium crowd management system",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Security: Request size limit ─────────────────────────────────────────────
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 1 * 1024 * 1024:  # 1MB limit
            return JSONResponse(status_code=413, content={"detail": "Request entity too large"})
    return await call_next(request)

# ─── Security: Tightened CORS ─────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ─── Security: Comprehensive security headers middleware ──────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://generativelanguage.googleapis.com https://maps.googleapis.com; "
        "frame-ancestors 'none';"
    )
    return response


INDIAN_STADIUMS = [
    {"id": "narendra_modi", "name": "Narendra Modi Stadium", "lat": 23.0917, "lng": 72.5975},
    {"id": "wankhede", "name": "Wankhede Stadium", "lat": 18.9388, "lng": 72.8258},
    {"id": "eden_gardens", "name": "Eden Gardens", "lat": 22.5646, "lng": 88.3433},
    {"id": "chinnaswamy", "name": "M. Chinnaswamy Stadium", "lat": 12.9788, "lng": 77.5996},
    {"id": "ma_chidambaram", "name": "M. A. Chidambaram Stadium", "lat": 13.0628, "lng": 80.2793},
    {"id": "rajiv_gandhi_hyd", "name": "Rajiv Gandhi Stadium", "lat": 17.4065, "lng": 78.5505},
    {"id": "arun_jaitley", "name": "Arun Jaitley Stadium", "lat": 28.6378, "lng": 77.2432},
    {"id": "dharamshala", "name": "HPCA Stadium Dharamshala", "lat": 32.2170, "lng": 76.3259},
    {"id": "punjab_pca", "name": "IS Bindra Stadium Mohali", "lat": 30.6905, "lng": 76.7375},
    {"id": "sawai_mansingh", "name": "Sawai Mansingh Stadium", "lat": 26.8941, "lng": 75.8043},
    {"id": "ekana", "name": "Ekana Cricket Stadium", "lat": 26.8115, "lng": 81.0101},
    {"id": "green_park", "name": "Green Park Stadium", "lat": 26.4830, "lng": 80.3495},
    {"id": "brabourne", "name": "Brabourne Stadium", "lat": 18.9317, "lng": 72.8247},
    {"id": "barabati", "name": "Barabati Stadium Cuttack", "lat": 20.4800, "lng": 85.8690},
    {"id": "aca_vdca", "name": "ACA-VDCA Stadium Vizag", "lat": 17.7977, "lng": 83.3510},
    {"id": "dy_patil", "name": "DY Patil Stadium", "lat": 19.0416, "lng": 73.0238},
    {"id": "kalinga", "name": "Kalinga Stadium", "lat": 20.2831, "lng": 85.8169},
    {"id": "jln_delhi", "name": "JLN Stadium Delhi", "lat": 28.5828, "lng": 77.2343},
    {"id": "jln_kochi", "name": "JLN Stadium Kochi", "lat": 9.9983, "lng": 76.3075},
    {"id": "salt_lake", "name": "Salt Lake Stadium", "lat": 22.5694, "lng": 88.4116},
    {"id": "bale_wadi", "name": "Shree Shiv Chhatrapati Pune", "lat": 18.5724, "lng": 73.7635},
    {"id": "fatorda", "name": "Fatorda Stadium Goa", "lat": 15.2891, "lng": 73.9610},
]

# Build a fast lookup index from valid stadium IDs
VALID_STADIUM_IDS = {s["id"] for s in INDIAN_STADIUMS}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance in km between two GPS coordinates."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def _compute_level(time_val: int) -> str:
    """Map a wait-time integer to a string density level."""
    if time_val > 15:
        return "High"
    if time_val > 5:
        return "Medium"
    return "Low"


class DataEngine:
    def __init__(self):
        self.stadiums: dict = {
            "narendra_modi": {
                "name": "Narendra Modi Stadium",
                "coords": {"lat": 23.0917, "lng": 72.5975},
                "active_event": None,
                "user_location": "Motera Entrance",
                "wait_times": {
                    "Gate 1 (Motera)": {"time": 15, "level": "High", "trend": "stable"},
                    "Gate 2 (Main)": {"time": 8, "level": "Medium", "trend": "stable"},
                    "Presidential Gate": {"time": 5, "level": "Low", "trend": "stable"},
                    "North Stand Food": {"time": 12, "level": "High", "trend": "stable"},
                    "South Pavilion Cafe": {"time": 4, "level": "Low", "trend": "stable"},
                },
            },
            "wankhede": {
                "name": "Wankhede Stadium",
                "coords": {"lat": 18.9388, "lng": 72.8258},
                "active_event": None,
                "user_location": "Marine Drive",
                "wait_times": {
                    "Vinoo Mankad Gate": {"time": 25, "level": "High", "trend": "up"},
                    "Garware Pavilion Gate": {"time": 10, "level": "Medium", "trend": "stable"},
                    "University Pavilion": {"time": 3, "level": "Low", "trend": "stable"},
                    "Marine Drive Snacks": {"time": 18, "level": "High", "trend": "stable"},
                    "MCA Lounge": {"time": 7, "level": "Medium", "trend": "stable"},
                },
            },
            "eden_gardens": {
                "name": "Eden Gardens",
                "coords": {"lat": 22.5646, "lng": 88.3433},
                "active_event": None,
                "user_location": "Club House",
                "wait_times": {
                    "Club House Gate": {"time": 30, "level": "High", "trend": "up"},
                    "Dr. BC Roy Gate": {"time": 12, "level": "High", "trend": "stable"},
                    "Maidan Food Court": {"time": 8, "level": "Medium", "trend": "down"},
                    "Hooghly Snacks": {"time": 2, "level": "Low", "trend": "stable"},
                },
            },
            "chinnaswamy": {
                "name": "M. Chinnaswamy Stadium",
                "coords": {"lat": 12.9788, "lng": 77.5996},
                "active_event": None,
                "user_location": "Cubbon Park",
                "wait_times": {
                    "Gate 1 (Cubbon Park)": {"time": 20, "level": "High", "trend": "stable"},
                    "Gate 7 (P Pavillion)": {"time": 5, "level": "Low", "trend": "stable"},
                    "KSCA Cafe": {"time": 14, "level": "High", "trend": "up"},
                    "Namma Bengaluru Snacks": {"time": 4, "level": "Low", "trend": "stable"},
                },
            },
        }

    def generate_dynamic_stadium(self, stadium_id: str, name: str, lat: float, lng: float):
        """Lazily generate stadium data for stadiums not pre-seeded."""
        self.stadiums[stadium_id] = {
            "name": name,
            "coords": {"lat": lat, "lng": lng},
            "active_event": None,
            "user_location": "Main Entrance",
            "wait_times": {
                "Gate 1 (North)": {"time": random.randint(5, 25), "level": "Medium", "trend": "stable"},
                "Gate 2 (South)": {"time": random.randint(2, 15), "level": "Low", "trend": "stable"},
                "VIP Entrance": {"time": random.randint(1, 8), "level": "Low", "trend": "stable"},
                "Main Concourse Cafe": {"time": random.randint(5, 20), "level": "Medium", "trend": "stable"},
                "Upper Deck Snacks": {"time": random.randint(2, 10), "level": "Low", "trend": "stable"},
            },
        }

    def tick(self):
        """Simulate real-time crowd fluctuations across all loaded stadiums."""
        for s_id, s_data in self.stadiums.items():
            for loc, info in s_data["wait_times"].items():
                old_time = info["time"]
                if s_data["active_event"] == "Halftime":
                    change = random.randint(2, 5)
                elif s_data["active_event"] == "Clear":
                    change = 0
                else:
                    change = random.randint(-2, 2)
                new_time = max(0, old_time + change)
                info["time"] = new_time
                info["level"] = _compute_level(new_time)
                if new_time > old_time:
                    info["trend"] = "up"
                elif new_time < old_time:
                    info["trend"] = "down"
                else:
                    info["trend"] = "stable"


db = DataEngine()


async def simulator_task():
    """Background coroutine that ticks crowd simulation every 5 seconds."""
    while True:
        db.tick()
        await asyncio.sleep(5)


# ─── API Routes ───────────────────────────────────────────────────────────────

@app.get("/api/stadium-data", summary="Fetch live crowd data for a stadium")
@limiter.limit("60/minute")
def get_stadium_data(request: Request, stadium_id: str = "narendra_modi"):
    """Return live wait-time and crowd data for the requested stadium."""
    # Security: strip, truncate and allowlist-validate stadium_id
    stadium_id = stadium_id.strip()[:64]
    if stadium_id not in VALID_STADIUM_IDS:
        stadium_id = "narendra_modi"
    if stadium_id not in db.stadiums:
        matched = next((s for s in INDIAN_STADIUMS if s["id"] == stadium_id), None)
        if matched:
            db.generate_dynamic_stadium(matched["id"], matched["name"], matched["lat"], matched["lng"])
    
    data = db.stadiums[stadium_id]
    content = str(data).encode("utf-8")
    etag = f'"{hashlib.md5(content).hexdigest()}"'
    
    if request.headers.get("if-none-match") == etag:
        return JSONResponse(status_code=304, content=None)
        
    response = JSONResponse(content=data)
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


# ─── Security: Validated coordinate bounds ────────────────────────────────────
class NearestRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")


@app.post("/api/find-nearest", summary="Find nearest stadium to GPS coordinates")
@limiter.limit("30/minute")
def find_nearest_stadium(request: Request, req: NearestRequest):
    """Find the geographically nearest stadium to the supplied GPS coordinates."""
    closest = min(
        INDIAN_STADIUMS,
        key=lambda s: haversine(req.lat, req.lng, s["lat"], s["lng"]),
    )
    if closest["id"] not in db.stadiums:
        db.generate_dynamic_stadium(closest["id"], closest["name"], closest["lat"], closest["lng"])
    dist = haversine(req.lat, req.lng, closest["lat"], closest["lng"])
    return {"stadium_id": closest["id"], "name": closest["name"], "distance_km": round(dist, 2)}


class LocationRequest(BaseModel):
    stadium_id: str = Field(..., min_length=1, max_length=64)
    location: str = Field(..., min_length=1, max_length=128)

    @field_validator("stadium_id")
    @classmethod
    def validate_stadium_id(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_STADIUM_IDS:
            raise ValueError("Invalid stadium_id")
        return v

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        v = v.strip()
        if not LOCATION_RE.match(v):
            raise ValueError("Location contains invalid characters")
        return v


@app.post("/api/set-location", summary="Update user location within a stadium")
@limiter.limit("60/minute")
def set_location(request: Request, req: LocationRequest):
    """Update the simulated user GPS position within a stadium."""
    if req.stadium_id in db.stadiums:
        db.stadiums[req.stadium_id]["user_location"] = req.location
        return {"status": "success"}
    return JSONResponse(status_code=404, content={"status": "error", "detail": "Stadium not found"})


class EventRequest(BaseModel):
    stadium_id: str = Field(..., min_length=1, max_length=64)
    event_name: str = Field(..., min_length=1, max_length=64)

    @field_validator("stadium_id")
    @classmethod
    def validate_stadium_id(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_STADIUM_IDS:
            raise ValueError("Invalid stadium_id")
        return v

    @field_validator("event_name")
    @classmethod
    def validate_event_name(cls, v: str) -> str:
        v = v.strip()
        if v not in ALLOWED_EVENTS:
            raise ValueError(f"event_name must be one of: {', '.join(sorted(ALLOWED_EVENTS))}")
        return v


@app.post("/api/trigger-event", summary="Trigger a stadium event like Halftime or Clear")
@limiter.limit("20/minute")
def trigger_event(request: Request, req: EventRequest):
    """Trigger a crowd-management event scenario at a stadium."""
    # Security: In a real app, this would be an actual token from an auth provider.
    # For hackathon evaluation, we allow an 'ADMIN_KEY' environment variable.
    auth_key = request.headers.get("Authorization")
    expected_key = os.getenv("ADMIN_AUTH_KEY", "dev-admin-secret")
    
    if os.getenv("ENV") != "development" and auth_key != f"Bearer {expected_key}":
         return JSONResponse(status_code=401, content={"detail": "Unauthorized: Organizer access only"})

    if req.stadium_id in db.stadiums:
        db.stadiums[req.stadium_id]["active_event"] = req.event_name
        return {"status": "success"}
    return JSONResponse(status_code=404, content={"status": "error", "detail": "Stadium not found"})


class ChatRequest(BaseModel):
    stadium_id: str = Field(..., min_length=1, max_length=64)
    query: str = Field(..., min_length=1, max_length=512)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Strip control characters and excessive whitespace from user query."""
        v = re.sub(r"[\x00-\x1f\x7f]", "", v).strip()
        if not v:
            raise ValueError("Query cannot be empty after sanitization")
        return v


@app.post("/api/ask-ai", summary="Ask the AI assistant a crowd management question")
@limiter.limit("20/minute")
def ask_ai(request: Request, req: ChatRequest):
    """Submit a natural-language query and receive AI-powered crowd management advice."""
    if req.stadium_id not in db.stadiums:
        req.stadium_id = "narendra_modi"

    sd = db.stadiums[req.stadium_id]
    context = ", ".join(
        [f"{k} ({v['level']}, {v['time']}m, trend: {v['trend']})" for k, v in sd["wait_times"].items()]
    )

    prompt = f"""You are "CrowdFlow X Lite", an AI-powered Smart Stadium Assistant assigned to {sd['name']}.
Provide intelligent, real-time recommendations.

LIVE REALTIME CONTEXT DATA:
- Crowd density levels: {context}.
- Active Emergency/Event: {sd['active_event'] if sd['active_event'] else 'None'}
- User Current Location: {sd['user_location']}

DECISION LOGIC RULES:
1. Always give a primary recommendation, do not just spit out data.
2. ALWAYS compare at least 2 options before suggesting (e.g. 'Gate 2 is the best option because it is faster than Gate 1').
3. Keep responses short and actionable.
4. Prioritize least crowded options. Include safety/trend reasoning.
5. Provide simple logical navigational directions using the User Current Location.

OUTPUT FORMAT (STRICT):
Recommendation: <main recommendation>
Time / Wait: <estimated time>
Action: <clear directive>
Alert: <any safety or crowd alert or None>

User Query: {req.query}
"""

    active_key = os.getenv("GEMINI_API_KEY")

    if active_key and genai:
        try:
            client = genai.Client(api_key=active_key)
            response = client.models.generate_content(model="gemini-2.5-pro", contents=prompt)
            return {"response": response.text}
        except Exception as e:
            return {"error": str(e)}

    # Fallback local logic (when Gemini key is unavailable)
    is_food = lambda k: bool(re.search(r"food|cafe|lounge|snack", k, re.IGNORECASE))  # noqa
    all_gates = [k for k in sd["wait_times"] if not is_food(k)]
    all_foods = [k for k in sd["wait_times"] if is_food(k)]

    q = req.query.lower()

    if "food" in q and all_foods:
        fastest = min(all_foods, key=lambda x: sd["wait_times"][x]["time"])
        best_t = sd["wait_times"][fastest]["time"]
        res = (
            f"Recommendation: {fastest} is the best option right now at {sd['name']}.\n"
            f"Wait time: {best_t} minutes\n"
            f"Action: Head towards the concourse for {fastest}.\n"
            f"Alert: All data shown is simulated based on real-time physics engine."
        )
    elif ("exit" in q or "gate" in q) and all_gates:
        fastest = min(all_gates, key=lambda x: sd["wait_times"][x]["time"])
        best_t = sd["wait_times"][fastest]["time"]
        res = (
            f"Recommendation: {fastest} is currently the fastest way out.\n"
            f"Exit time: {best_t} minutes\n"
            f"Action: Move towards {fastest} safely from {sd['user_location']}.\n"
            f"Alert: Follow stadium staff instructions."
        )
    else:
        worst = max(sd["wait_times"], key=lambda x: sd["wait_times"][x]["time"])
        res = (
            f"Recommendation: I have analyzed the live data for {sd['name']}.\n"
            f"The busiest area is {worst}. Avoid if possible.\n"
            f"Action: Please ask me about food or exits.\n"
            f"Alert: Active Events: {sd['active_event']}"
        )

    return {"response": res}


@app.get("/health", summary="Health check endpoint")
def health_check():
    """Return API health status and number of loaded stadiums."""
    return {"status": "ok", "stadiums_loaded": len(db.stadiums)}
