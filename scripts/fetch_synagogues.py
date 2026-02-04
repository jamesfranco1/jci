"""
Fetch Synagogue Data from OpenStreetMap

Downloads synagogue locations via Overpass API and saves as GeoJSON.

Usage:
    python fetch_synagogues.py --output ../data/processed/synagogues.geojson
"""

import argparse
import json
import requests
from pathlib import Path

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# East Coast bounding box
BBOX = {
    "south": 24,
    "west": -90,
    "north": 48,
    "east": -66
}

def fetch_synagogues():
    """Fetch synagogues from Overpass API."""
    query = f"""
    [out:json][timeout:120];
    (
        node["amenity"="place_of_worship"]["religion"="jewish"]({BBOX['south']},{BBOX['west']},{BBOX['north']},{BBOX['east']});
        way["amenity"="place_of_worship"]["religion"="jewish"]({BBOX['south']},{BBOX['west']},{BBOX['north']},{BBOX['east']});
        relation["amenity"="place_of_worship"]["religion"="jewish"]({BBOX['south']},{BBOX['west']},{BBOX['north']},{BBOX['east']});
    );
    out center;
    """
    
    print("Fetching synagogues from OpenStreetMap...")
    print(f"Bounding box: {BBOX}")
    
    response = requests.post(OVERPASS_URL, data=query)
    response.raise_for_status()
    
    data = response.json()
    
    print(f"Received {len(data['elements'])} elements")
    
    return data

def convert_to_geojson(osm_data):
    """Convert OSM data to GeoJSON."""
    features = []
    
    for element in osm_data["elements"]:
        # Get coordinates
        if element["type"] == "node":
            lat, lng = element["lat"], element["lon"]
        elif "center" in element:
            lat, lng = element["center"]["lat"], element["center"]["lon"]
        else:
            continue
        
        tags = element.get("tags", {})
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "osm_id": element["id"],
                "osm_type": element["type"],
                "name": tags.get("name", "Unnamed Synagogue"),
                "denomination": tags.get("denomination", ""),
                "address": " ".join(filter(None, [
                    tags.get("addr:housenumber", ""),
                    tags.get("addr:street", ""),
                    tags.get("addr:city", ""),
                    tags.get("addr:state", ""),
                    tags.get("addr:postcode", "")
                ])),
                "website": tags.get("website", ""),
                "phone": tags.get("phone", ""),
                "wheelchair": tags.get("wheelchair", ""),
                "opening_hours": tags.get("opening_hours", "")
            }
        }
        
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def main():
    parser = argparse.ArgumentParser(description="Fetch synagogue data from OpenStreetMap")
    parser.add_argument("--output", type=Path, default=Path("../data/processed/synagogues.geojson"))
    
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    
    # Fetch data
    osm_data = fetch_synagogues()
    
    # Convert to GeoJSON
    geojson = convert_to_geojson(osm_data)
    
    print(f"Converted to {len(geojson['features'])} GeoJSON features")
    
    # Stats by denomination
    denominations = {}
    for feature in geojson["features"]:
        denom = feature["properties"]["denomination"] or "Unknown"
        denominations[denom] = denominations.get(denom, 0) + 1
    
    print("\nBy denomination:")
    for denom, count in sorted(denominations.items(), key=lambda x: -x[1]):
        print(f"  {denom}: {count}")
    
    # Save
    with open(args.output, "w") as f:
        json.dump(geojson, f, indent=2)
    
    print(f"\nSaved to {args.output}")

if __name__ == "__main__":
    main()

