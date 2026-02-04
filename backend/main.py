"""
PROXY MAP - Backend API
FastAPI server for serving geographic data
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import random
import math
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel

app = FastAPI(
    title="Proxy Map API",
    description="API for population proxy visualization",
    version="0.1.0"
)

# CORS for frontend
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

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float
    surname: str
    count: int

# ============================================
# Surname Data
# ============================================

SURNAME_LIST = [
    {"name": "Cohen", "weight": 0.95, "origin": "kohanim"},
    {"name": "Kohn", "weight": 0.94, "origin": "kohanim"},
    {"name": "Levy", "weight": 0.92, "origin": "levite"},
    {"name": "Levi", "weight": 0.93, "origin": "levite"},
    {"name": "Levin", "weight": 0.88, "origin": "levite"},
    {"name": "Levine", "weight": 0.88, "origin": "levite"},
    {"name": "Goldberg", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Goldstein", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Goldman", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Rosenberg", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Rosenthal", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Rosen", "weight": 0.82, "origin": "ashkenazi"},
    {"name": "Weinberg", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Weinstein", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Weiss", "weight": 0.78, "origin": "ashkenazi"},
    {"name": "Schwartz", "weight": 0.75, "origin": "ashkenazi"},
    {"name": "Friedman", "weight": 0.85, "origin": "ashkenazi"},
    {"name": "Silverman", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Bernstein", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Epstein", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Feinstein", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Finkelstein", "weight": 0.94, "origin": "ashkenazi"},
    {"name": "Horowitz", "weight": 0.92, "origin": "ashkenazi"},
    {"name": "Moskowitz", "weight": 0.94, "origin": "ashkenazi"},
    {"name": "Rabinowitz", "weight": 0.95, "origin": "ashkenazi"},
    {"name": "Shapiro", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Klein", "weight": 0.70, "origin": "ashkenazi"},
    {"name": "Katz", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Kaplan", "weight": 0.85, "origin": "kohanim"},
    {"name": "Greenberg", "weight": 0.90, "origin": "ashkenazi"},
    {"name": "Feldman", "weight": 0.85, "origin": "ashkenazi"},
    {"name": "Kaufman", "weight": 0.78, "origin": "ashkenazi"},
    {"name": "Schiff", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Perlman", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Segal", "weight": 0.88, "origin": "ashkenazi"},
    {"name": "Siegel", "weight": 0.85, "origin": "ashkenazi"},
]

# Population centers with weights
POPULATION_CENTERS = [
    {"lat": 40.7128, "lng": -74.0060, "name": "Manhattan", "weight": 1.0, "radius": 0.15},
    {"lat": 40.6501, "lng": -73.9496, "name": "Brooklyn", "weight": 1.0, "radius": 0.12},
    {"lat": 40.7429, "lng": -73.6138, "name": "Great Neck", "weight": 0.95, "radius": 0.05},
    {"lat": 41.2565, "lng": -74.0998, "name": "Monsey", "weight": 0.98, "radius": 0.06},
    {"lat": 40.9176, "lng": -74.0301, "name": "Teaneck", "weight": 0.92, "radius": 0.06},
    {"lat": 40.0583, "lng": -74.4057, "name": "Lakewood", "weight": 0.98, "radius": 0.08},
    {"lat": 26.3683, "lng": -80.1289, "name": "Boca Raton", "weight": 0.92, "radius": 0.10},
    {"lat": 25.7907, "lng": -80.1300, "name": "Miami Beach", "weight": 0.88, "radius": 0.06},
    {"lat": 42.3463, "lng": -71.1526, "name": "Brookline", "weight": 0.88, "radius": 0.05},
    {"lat": 38.9897, "lng": -77.0997, "name": "Bethesda", "weight": 0.82, "radius": 0.06},
    {"lat": 39.3772, "lng": -76.7395, "name": "Pikesville", "weight": 0.90, "radius": 0.05},
    {"lat": 40.0379, "lng": -75.1302, "name": "Cheltenham", "weight": 0.82, "radius": 0.05},
    {"lat": 41.4648, "lng": -81.5047, "name": "Beachwood", "weight": 0.88, "radius": 0.05},
    {"lat": 33.9519, "lng": -84.3341, "name": "Sandy Springs", "weight": 0.72, "radius": 0.06},
]

# ============================================
# Helper Functions
# ============================================

def weighted_random_choice(items, weight_key="weight"):
    """Pick a random item weighted by the weight_key field."""
    total = sum(item[weight_key] for item in items)
    r = random.random() * total
    for item in items:
        r -= item[weight_key]
        if r <= 0:
            return item
    return items[0]

def generate_point_near_center(center):
    """Generate a random point near a population center."""
    angle = random.random() * 2 * math.pi
    # Gaussian-ish distribution
    r = center["radius"] * math.sqrt(-2 * math.log(random.random())) * 0.5
    
    lat = center["lat"] + r * math.cos(angle)
    lng = center["lng"] + r * math.sin(angle) / math.cos(center["lat"] * math.pi / 180)
    
    return {"lat": lat, "lng": lng}

def generate_heatmap_data(surname: Optional[str] = None, num_points: int = 15000):
    """Generate synthetic heatmap GeoJSON data."""
    features = []
    
    # Filter surnames if specific one requested
    surnames = SURNAME_LIST
    if surname:
        surnames = [s for s in SURNAME_LIST if s["name"].lower() == surname.lower()]
        if not surnames:
            surnames = SURNAME_LIST  # Fallback to all
    
    for i in range(num_points):
        center = weighted_random_choice(POPULATION_CENTERS)
        point = generate_point_near_center(center)
        surname_data = weighted_random_choice(surnames)
        
        weight = center["weight"] * surname_data["weight"] * (0.5 + random.random() * 0.5)
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [point["lng"], point["lat"]]
            },
            "properties": {
                "weight": weight,
                "surname": surname_data["name"],
                "cell_id": f"cell_{i}",
                "count": int(weight * 50) + 1
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Proxy Map API", "version": "0.1.0"}

@app.get("/api/surnames", response_model=List[Surname])
async def get_surnames():
    """Get list of all tracked surnames with weights."""
    return [Surname(**s) for s in sorted(SURNAME_LIST, key=lambda x: -x["weight"])]

@app.get("/api/heatmap")
async def get_heatmap(
    surname: Optional[str] = Query(None, description="Filter by specific surname"),
    limit: int = Query(15000, ge=100, le=50000, description="Number of points to generate")
):
    """
    Get heatmap GeoJSON data.
    Optionally filter by a specific surname.
    """
    return generate_heatmap_data(surname=surname, num_points=limit)

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get aggregate statistics."""
    return StatsResponse(
        total_records=15000,  # Synthetic
        total_surnames=len(SURNAME_LIST),
        total_synagogues=850,  # Approximate
        states_covered=9
    )

@app.get("/api/search")
async def search_location(q: str = Query(..., min_length=1, description="Search query")):
    """
    Geocode a location query.
    In production, this would use Mapbox Geocoding API.
    """
    # Placeholder - frontend uses Mapbox directly
    return {"query": q, "message": "Use Mapbox Geocoding API on frontend"}

# ============================================
# Static File Serving
# ============================================

# Check if static data files exist
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Serve frontend
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    @app.get("/app")
    async def serve_frontend():
        return FileResponse(FRONTEND_DIR / "index.html")

# ============================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

