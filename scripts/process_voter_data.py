"""
Voter Data Processing Pipeline

This script processes state voter registration files to extract
surname-based demographic data aggregated to privacy-preserving cells.

Usage:
    python process_voter_data.py --state FL --input voter_file.txt --output ../data/processed/

Pipeline:
    1. Load voter file (state-specific format)
    2. Match last names against surname list
    3. Geocode addresses via Census Bureau API
    4. Assign to ~500m privacy cells
    5. Aggregate counts per cell
    6. Output GeoJSON
"""

import argparse
import csv
import json
import math
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict

# For real implementation, uncomment:
# import pandas as pd
# import geopandas as gpd
# import requests
# from geopy.geocoders import Nominatim

# ============================================
# Configuration
# ============================================

# Cell size in degrees (approximately 500m at mid-latitudes)
CELL_SIZE = 0.005  # ~500m

# Surname list with weights
SURNAME_LIST = {
    "cohen": 0.95, "kohn": 0.94, "levy": 0.92, "levi": 0.93,
    "levin": 0.88, "levine": 0.88, "goldberg": 0.92, "goldstein": 0.92,
    "goldman": 0.88, "rosenberg": 0.90, "rosenthal": 0.88, "rosen": 0.82,
    "weinberg": 0.88, "weinstein": 0.90, "weiss": 0.78, "schwartz": 0.75,
    "friedman": 0.85, "silverman": 0.88, "bernstein": 0.90, "epstein": 0.92,
    "feinstein": 0.92, "finkelstein": 0.94, "horowitz": 0.92, "moskowitz": 0.94,
    "rabinowitz": 0.95, "shapiro": 0.90, "klein": 0.70, "katz": 0.88,
    "kaplan": 0.85, "greenberg": 0.90, "feldman": 0.85, "kaufman": 0.78,
    "schiff": 0.88, "perlman": 0.88, "segal": 0.88, "siegel": 0.85,
    # Add more surnames...
}

# State-specific file formats
STATE_FORMATS = {
    "FL": {
        "delimiter": "\t",
        "encoding": "latin-1",
        "name_col": "Name_Last",
        "address_cols": ["Residence_Address_Line_1", "Residence_City", "Residence_State", "Residence_Zipcode"],
    },
    "NC": {
        "delimiter": "\t", 
        "encoding": "utf-8",
        "name_col": "last_name",
        "address_cols": ["res_street_address", "res_city_desc", "state_cd", "zip_code"],
    },
    "PA": {
        "delimiter": ",",
        "encoding": "utf-8",
        "name_col": "Last Name",
        "address_cols": ["House Number", "Street Name", "City", "State", "Zip"],
    },
    "OH": {
        "delimiter": ",",
        "encoding": "utf-8",
        "name_col": "LAST_NAME",
        "address_cols": ["RESIDENTIAL_ADDRESS1", "RESIDENTIAL_CITY", "RESIDENTIAL_STATE", "RESIDENTIAL_ZIP"],
    },
}

# ============================================
# Data Structures
# ============================================

@dataclass
class VoterRecord:
    surname: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    cell_id: Optional[str] = None
    weight: float = 0.0

@dataclass  
class CellAggregate:
    cell_id: str
    lat: float
    lng: float
    surname_counts: Dict[str, int]
    total_count: int
    weighted_sum: float

# ============================================
# Processing Functions
# ============================================

def get_cell_id(lat: float, lng: float) -> Tuple[str, float, float]:
    """
    Convert lat/lng to a privacy cell ID and centroid.
    Uses a simple grid system.
    """
    cell_lat = math.floor(lat / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    cell_lng = math.floor(lng / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    cell_id = f"{cell_lat:.4f}_{cell_lng:.4f}"
    return cell_id, cell_lat, cell_lng

def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Geocode an address using Census Bureau API.
    Returns (lat, lng) or None if failed.
    
    Rate limited to ~1000 requests/minute.
    """
    # Placeholder - implement with real geocoding
    # 
    # Real implementation would be:
    # url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
    # params = {
    #     "address": address,
    #     "benchmark": "Public_AR_Current",
    #     "format": "json"
    # }
    # response = requests.get(url, params=params)
    # data = response.json()
    # if data.get("result", {}).get("addressMatches"):
    #     match = data["result"]["addressMatches"][0]
    #     return (match["coordinates"]["y"], match["coordinates"]["x"])
    # return None
    
    return None

def load_voter_file(filepath: Path, state: str) -> List[VoterRecord]:
    """Load and parse a state voter registration file."""
    format_config = STATE_FORMATS.get(state)
    if not format_config:
        raise ValueError(f"Unknown state format: {state}")
    
    records = []
    matched = 0
    total = 0
    
    print(f"Loading {filepath}...")
    
    # For demonstration - real implementation would use pandas
    # df = pd.read_csv(filepath, 
    #                  sep=format_config["delimiter"],
    #                  encoding=format_config["encoding"],
    #                  low_memory=False)
    
    # Placeholder: simulate loading
    print(f"Would load file with format: {format_config}")
    print("Matching surnames against list...")
    
    return records

def aggregate_to_cells(records: List[VoterRecord]) -> List[CellAggregate]:
    """Aggregate geocoded records to privacy cells."""
    cells: Dict[str, CellAggregate] = {}
    
    for record in records:
        if not record.cell_id:
            continue
            
        if record.cell_id not in cells:
            cells[record.cell_id] = CellAggregate(
                cell_id=record.cell_id,
                lat=record.lat,
                lng=record.lng,
                surname_counts=defaultdict(int),
                total_count=0,
                weighted_sum=0.0
            )
        
        cell = cells[record.cell_id]
        cell.surname_counts[record.surname] += 1
        cell.total_count += 1
        cell.weighted_sum += record.weight
    
    return list(cells.values())

def export_geojson(cells: List[CellAggregate], output_path: Path):
    """Export aggregated cells to GeoJSON."""
    features = []
    
    for cell in cells:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [cell.lng, cell.lat]
            },
            "properties": {
                "cell_id": cell.cell_id,
                "count": cell.total_count,
                "weight": cell.weighted_sum,
                "surnames": dict(cell.surname_counts)
            }
        })
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    
    print(f"Exported {len(features)} cells to {output_path}")

# ============================================
# Main Pipeline
# ============================================

def process_state(state: str, input_path: Path, output_dir: Path):
    """Run full processing pipeline for a state."""
    print(f"\n{'='*50}")
    print(f"Processing {state} voter data")
    print(f"{'='*50}")
    
    # Step 1: Load and filter
    records = load_voter_file(input_path, state)
    print(f"Loaded {len(records)} matching records")
    
    # Step 2: Geocode (this is the slow part)
    print("Geocoding addresses...")
    geocoded = 0
    for i, record in enumerate(records):
        result = geocode_address(record.address)
        if result:
            record.lat, record.lng = result
            cell_id, cell_lat, cell_lng = get_cell_id(record.lat, record.lng)
            record.cell_id = cell_id
            record.lat = cell_lat  # Replace with cell centroid
            record.lng = cell_lng
            geocoded += 1
        
        if (i + 1) % 1000 == 0:
            print(f"  Processed {i + 1}/{len(records)} ({geocoded} geocoded)")
    
    print(f"Successfully geocoded {geocoded}/{len(records)} records")
    
    # Step 3: Aggregate
    print("Aggregating to privacy cells...")
    cells = aggregate_to_cells(records)
    print(f"Created {len(cells)} unique cells")
    
    # Step 4: Export
    output_path = output_dir / f"{state.lower()}_surname_density.geojson"
    export_geojson(cells, output_path)
    
    # CRITICAL: Original addresses are NOT saved anywhere
    print("\n⚠️  Original addresses discarded - only cell data retained")

def main():
    parser = argparse.ArgumentParser(description="Process voter registration data")
    parser.add_argument("--state", required=True, choices=["FL", "NC", "PA", "OH"])
    parser.add_argument("--input", required=True, type=Path, help="Input voter file")
    parser.add_argument("--output", required=True, type=Path, help="Output directory")
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        return 1
    
    args.output.mkdir(parents=True, exist_ok=True)
    
    process_state(args.state, args.input, args.output)
    
    return 0

if __name__ == "__main__":
    exit(main())

