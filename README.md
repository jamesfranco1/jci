# Proxy Map

Interactive layered map for visualizing population proxy data using surnames as demographic indicators.

## Quick Start

### 1. Get a Mapbox Token

1. Create a free account at [mapbox.com](https://account.mapbox.com/)
2. Copy your default public token
3. Edit `frontend/config.js` and replace `YOUR_MAPBOX_TOKEN_HERE`

### 2. Run Frontend Only (Static)

Simply open `frontend/index.html` in a browser, or serve it:

```bash
cd frontend
python -m http.server 3000
# Open http://localhost:3000
```

### 3. Run with Backend API

```bash
# Install dependencies
pip install -r requirements.txt

# Start API server
cd backend
uvicorn main:app --reload --port 8000

# Frontend at http://localhost:8000/app
# API docs at http://localhost:8000/docs
```

## Features

- **Synagogue Layer**: Real data from OpenStreetMap
- **Surname Heatmap**: Density visualization with surname filtering
- **Concentration Index**: County-level choropleth (coming soon)
- **Billionaire Layer**: Forbes 400 residence locations

## Data Layers

| Layer | Source | Status |
|-------|--------|--------|
| Synagogues | OpenStreetMap Overpass API | ✅ Live |
| Surname Density | Synthetic (realistic distribution) | ✅ Working |
| Concentration Index | Computed from surname data | 🚧 Placeholder |
| Billionaires | Forbes 400 + manual research | ✅ Synthetic |

## Data Sources for Real Implementation

### Voter Registration Files

| State | Access | URL |
|-------|--------|-----|
| Florida | Free | [dos.myflorida.com](https://dos.myflorida.com/elections/data-statistics/voter-registration-statistics/) |
| North Carolina | Free | [ncsbe.gov](https://www.ncsbe.gov/results-data/voter-registration-data) |
| Pennsylvania | ~$20 | [dos.pa.gov](https://www.dos.pa.gov/VotingElections/OtherServicesEvents/Pages/Voter-Registration-Data-Requests.aspx) |
| Ohio | Small fee | [ohiosos.gov](https://www.ohiosos.gov/elections-voting/campaign-finance/voter-files/) |

### Geographic Boundaries

- Census TIGER/Line Shapefiles: [census.gov](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)

## Project Structure

```
jewscan/
├── frontend/
│   ├── index.html      # Main app
│   ├── style.css       # Dark theme styling
│   ├── config.js       # Mapbox token & settings
│   ├── data.js         # Surname list & data generation
│   └── map.js          # Mapbox GL JS controller
├── backend/
│   ├── main.py         # FastAPI server
│   └── static/         # Pre-computed GeoJSON files
├── data/
│   ├── raw/            # Original voter files (not committed)
│   └── processed/      # Aggregated GeoJSON
├── scripts/
│   └── process_voter_data.py  # Data pipeline (coming soon)
└── requirements.txt
```

## Privacy Design

All data is aggregated to ~500m grid cells. Original addresses are:
1. Geocoded to determine cell assignment
2. Assigned to cell centroid
3. **Permanently discarded**

No individual locations are stored or displayed.

## Tech Stack

- **Frontend**: Mapbox GL JS, vanilla JavaScript
- **Backend**: FastAPI (Python)
- **Data**: GeoJSON, SQLite (optional)

## License

Educational/research purposes only.

