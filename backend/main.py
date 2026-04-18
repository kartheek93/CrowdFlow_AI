import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import random
import math
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

try:
    from google import genai
except ImportError:
    pass

app = FastAPI(title="CrowdFlow X Stadium Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

class DataEngine:
    def __init__(self):
        self.stadiums = {
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
                }
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
                }
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
                }
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
                }
            }
        }

    def generate_dynamic_stadium(self, stadium_id, name, lat, lng):
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
            }
        }

    def tick(self):
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
                self._update_level(info)
                
                if new_time > old_time:
                    info["trend"] = "up"
                elif new_time < old_time:
                    info["trend"] = "down"
                else:
                    info["trend"] = "stable"
                
    def _update_level(self, info_obj):
        t = info_obj["time"]
        if t > 15:
            info_obj["level"] = "High"
        elif t > 5:
            info_obj["level"] = "Medium"
        else:
            info_obj["level"] = "Low"

db = DataEngine()

async def simulator_task():
    while True:
        db.tick()
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulator_task())

@app.get("/api/stadium-data")
def get_stadium_data(stadium_id: str = "narendra_modi"):
    if stadium_id not in db.stadiums:
        # Fallback dynamic injection if somehow missed
        matched = next((s for s in INDIAN_STADIUMS if s["id"] == stadium_id), None)
        if matched:
            db.generate_dynamic_stadium(matched["id"], matched["name"], matched["lat"], matched["lng"])
        else:
            stadium_id = "narendra_modi"
            
    return db.stadiums[stadium_id]

class NearestRequest(BaseModel):
    lat: float
    lng: float

@app.post("/api/find-nearest")
def find_nearest_stadium(req: NearestRequest):
    closest = None
    min_dist = float('inf')
    
    for s in INDIAN_STADIUMS:
        dist = haversine(req.lat, req.lng, s["lat"], s["lng"])
        if dist < min_dist:
            min_dist = dist
            closest = s
            
    if closest:
        if closest["id"] not in db.stadiums:
            db.generate_dynamic_stadium(closest["id"], closest["name"], closest["lat"], closest["lng"])
        return {"stadium_id": closest["id"], "name": closest["name"], "distance_km": round(min_dist, 2)}
    
    return {"error": "Failed to resolve"}

class LocationRequest(BaseModel):
    stadium_id: str
    location: str

@app.post("/api/set-location")
def set_location(req: LocationRequest):
    if req.stadium_id in db.stadiums:
        db.stadiums[req.stadium_id]["user_location"] = req.location
        return {"status": "success"}
    return {"status": "error"}

class EventRequest(BaseModel):
    stadium_id: str
    event_name: str 

@app.post("/api/trigger-event")
def trigger_event(req: EventRequest):
    if req.stadium_id in db.stadiums:
        db.stadiums[req.stadium_id]["active_event"] = req.event_name
        return {"status": "success"}
    return {"status": "error"}

class ChatRequest(BaseModel):
    stadium_id: str
    query: str

@app.post("/api/ask-ai")
def ask_ai(req: ChatRequest):
    if req.stadium_id not in db.stadiums:
        req.stadium_id = "narendra_modi"
        
    sd = db.stadiums[req.stadium_id]
    context = ", ".join([f"{k} ({v['level']}, {v['time']}m, trend: {v['trend']})" for k,v in sd['wait_times'].items()])
    
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

OUTPUT FORMAT (STRICT EXTRACT):
OUTPUT FORMAT (STRICT EXTRACT):
Recommendation
Time / Wait
Action
Alert (if any)

User Query: {req.query}
"""
    
    active_key = os.getenv("GEMINI_API_KEY")

    if active_key:
        try:
            client = genai.Client(api_key=active_key)
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            return {"response": response.text}
        except Exception as e:
            return {"error": str(e)}

    all_gates = [k for k in sd["wait_times"].keys() if "gate" in k.lower() or "entrance" in k.lower()]
    all_foods = [k for k in sd["wait_times"].keys() if "food" in k.lower() or "snack" in k.lower() or "cafe" in k.lower() or "lounge" in k.lower()]
    
    q = req.query.lower()
    
    if "food" in q and all_foods:
        fastest = min(all_foods, key=lambda x: sd["wait_times"][x]["time"])
        best_t = sd["wait_times"][fastest]["time"]
        res = f"Recommendation: {fastest} is the best option right now at {sd['name']}.\nWait time: {best_t} minutes\nAction: Head towards the concourse for {fastest}.\nAlert: All data shown is purely simulated based on real-time physics engine."
    elif ("exit" in q or "gate" in q) and all_gates:
        fastest = min(all_gates, key=lambda x: sd["wait_times"][x]["time"])
        best_t = sd["wait_times"][fastest]["time"]
        res = f"Recommendation: {fastest} is currently the fastest way out.\nExit time: {best_t} minutes\nAction: Move towards {fastest} safely from {sd['user_location']}.\nAlert: Follow stadium staff instructions."
    else:
        worst = max(sd["wait_times"].keys(), key=lambda x: sd["wait_times"][x]["time"])
        res = f"Recommendation: I have analyzed the live data for {sd['name']}.\nThe busiest area is {worst}. Avoid if possible.\nAction: Please ask me about food or exits.\nAlert: Active Events: {sd['active_event']}"
        
    return {"response": res}
