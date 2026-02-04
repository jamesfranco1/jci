// ============================================
// PROXY MAP - Configuration
// ============================================

const CONFIG = {
    // Mapbox Configuration
    // Get your free token at: https://account.mapbox.com/
    MAPBOX_TOKEN: 'pk.eyJ1IjoiZ3J1YmJ5aGF0IiwiYSI6ImNtbDc3MHFzeTBqbTAzZ3F4NDkwY2s1ZWMifQ.2VnF8VhpinlekVme4CeicQ',
    
    // Map defaults - East Coast centered (FL, PA, NY, MA only)
    MAP: {
        center: [-75.5, 39.5],  // Mid-Atlantic
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        style: 'mapbox://styles/mapbox/light-v11'
    },
    
    // API endpoints (when backend is running)
    API: {
        BASE_URL: 'http://localhost:8000/api',
        ENDPOINTS: {
            surnames: '/surnames',
            heatmap: '/heatmap',
            search: '/search',
            stats: '/stats'
        }
    },
    
    // Layer styling
    LAYERS: {
        synagogues: {
            color: '#1d4ed8',
            radius: 5,
            blur: 1,
            opacity: 0.9
        },
        heatmap: {
            // Weight stops: [zoom, weight]
            weight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
            // Intensity increases with zoom
            intensity: ['interpolate', ['linear'], ['zoom'], 0, 0.5, 12, 3],
            // Color ramp
            colorRamp: [
                0, 'rgba(255, 255, 255, 0)',
                0.1, 'rgba(191, 219, 254, 0.35)',
                0.3, 'rgba(147, 197, 253, 0.55)',
                0.5, 'rgba(96, 165, 250, 0.75)',
                0.7, 'rgba(59, 130, 246, 0.9)',
                1, 'rgba(29, 78, 216, 1)'
            ],
            radius: ['interpolate', ['linear'], ['zoom'], 0, 2, 12, 20],
            opacity: 0.8
        },
        choropleth: {
            // Index value to color mapping
            colors: [
                [0, 0.5, '#1a1a2e'],
                [0.5, 1.0, '#16213e'],
                [1.0, 2.0, '#0f3460'],
                [2.0, 5.0, '#e94560'],
                [5.0, 100, '#ff6b6b']
            ],
            opacity: 0.4,
            outlineColor: '#ffffff',
            outlineWidth: 0.5
        },
        billionaires: {
            color: '#0ea5e9',
            radius: 8,
            blur: 0,
            opacity: 0.9,
            strokeColor: '#ffffff',
            strokeWidth: 1
        }
    },
    
    // East Coast states for coverage
    STATES: {
        COVERED: ['FL', 'NC', 'PA', 'OH', 'NY', 'NJ', 'MA', 'CT', 'VA', 'MD', 'DE', 'GA', 'SC'],
        FIPS: {
            'FL': '12', 'NC': '37', 'PA': '42', 'OH': '39',
            'NY': '36', 'NJ': '34', 'MA': '25', 'CT': '09',
            'VA': '51', 'MD': '24', 'DE': '10', 'GA': '13', 'SC': '45'
        }
    }
};

// Freeze config to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.MAP);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.LAYERS);
Object.freeze(CONFIG.STATES);

