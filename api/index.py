"""
JCI - Vercel FastAPI Entrypoint
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
import random
import math

app = FastAPI(
    title="JCI API",
    description="Jew Concentration Index API",
    version="0.2.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Data Models
# ============================================

class Surname(BaseModel):
    name: str
    weight: float
    origin: str

class StatsResponse(BaseModel):
    total_records: int
    total_surnames: int
    total_synagogues: int
    states_covered: int

# ============================================
# Surname Data
# ============================================

SURNAME_LIST = [
    {"name": "Cohen", "weight": 0.95, "origin": "kohanim"},
    {"name": "Levy", "weight": 0.92, "origin": "levite"},
    {"name": "Goldberg", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Goldstein", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Rosenberg", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Friedman", "weight": 0.85, "origin": "ashkenazi"},
    {"name": "Shapiro", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Bernstein", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Weinstein", "weight": 0.90, "origin": "ashkenazi"},
]

POPULATION_CENTERS = [
    {"lat": 40.7128, "lng": -74.0060, "name": "Manhattan", "weight": 1.0, "radius": 0.15},
    {"lat": 40.6501, "lng": -73.9496, "name": "Brooklyn", "weight": 1.0, "radius": 0.12},
    {"lat": 40.7429, "lng": -73.6138, "name": "Great Neck", "weight": 0.95, "radius": 0.05},
    {"lat": 26.3683, "lng": -80.1289, "name": "Boca Raton", "weight": 0.92, "radius": 0.10},
    {"lat": 25.7907, "lng": -80.1300, "name": "Miami Beach", "weight": 0.88, "radius": 0.06},
    {"lat": 42.3463, "lng": -71.1526, "name": "Brookline", "weight": 0.88, "radius": 0.05},
]

# ============================================
# Helper Functions
# ============================================

def weighted_random_choice(items, weight_key="weight"):
    total = sum(item[weight_key] for item in items)
    r = random.random() * total
    for item in items:
        r -= item[weight_key]
        if r <= 0:
            return item
    return items[0]

def generate_point_near_center(center):
    angle = random.random() * 2 * math.pi
    r = center["radius"] * math.sqrt(-2 * math.log(random.random())) * 0.5
    lat = center["lat"] + r * math.cos(angle)
    lng = center["lng"] + r * math.sin(angle) / math.cos(center["lat"] * math.pi / 180)
    return {"lat": lat, "lng": lng}

def generate_heatmap_data(surname: Optional[str] = None, num_points: int = 15000):
    features = []
    surnames = SURNAME_LIST
    if surname:
        surnames = [s for s in SURNAME_LIST if s["name"].lower() == surname.lower()]
        if not surnames:
            surnames = SURNAME_LIST
    
    for i in range(num_points):
        center = weighted_random_choice(POPULATION_CENTERS)
        point = generate_point_near_center(center)
        surname_data = weighted_random_choice(surnames)
        weight = center["weight"] * surname_data["weight"] * (0.5 + random.random() * 0.5)
        
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [point["lng"], point["lat"]]},
            "properties": {"weight": weight, "surname": surname_data["name"], "count": int(weight * 50) + 1}
        })
    
    return {"type": "FeatureCollection", "features": features}

# ============================================
# API Endpoints
# ============================================

@app.get("/api")
async def root():
    return {"status": "ok", "service": "JCI API", "version": "0.2.0"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/surnames")
async def get_surnames():
    return [Surname(**s) for s in sorted(SURNAME_LIST, key=lambda x: -x["weight"])]

@app.get("/api/heatmap")
async def get_heatmap(
    surname: Optional[str] = Query(None),
    limit: int = Query(15000, ge=100, le=50000)
):
    return generate_heatmap_data(surname=surname, num_points=limit)

@app.get("/api/stats")
async def get_stats():
    return StatsResponse(total_records=15000, total_surnames=len(SURNAME_LIST), total_synagogues=850, states_covered=12)

