// ============================================
// PROXY MAP - Main Map Controller
// ============================================

class ProxyMap {
    constructor() {
        this.map = null;
        this.layers = {
            surnames: true,
            synagogues: true,
            billionaires: false,
            schools: false,
            chabad: false,
            jcc: false,
            aipac: false
        };
        this.selectedSurnames = [...DATA.TOP_SURNAMES.map(s => s.name)];
        this.allSurnameData = null;
        this.tooltip = document.getElementById('tooltip');
        
        this.init();
    }
    
    async init() {
        if (CONFIG.MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE') {
            this.showTokenError();
            return;
        }
        
        mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: CONFIG.MAP.style,
            center: CONFIG.MAP.center,
            zoom: CONFIG.MAP.zoom,
            minZoom: CONFIG.MAP.minZoom,
            maxZoom: CONFIG.MAP.maxZoom
        });
        
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        this.map.on('load', () => this.onMapLoad());
        
        this.setupUIHandlers();
        this.populateSurnameGrid();
    }
    
    showTokenError() {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #ef4444; margin-bottom: 16px;">Mapbox Token Required</h2>
                <p style="color: #a1a1aa;">Edit <code>frontend/config.js</code></p>
            </div>
        `;
    }
    
    async onMapLoad() {
        try {
            console.log('Map loaded, generating grid data...');
            
            await DATA.loadLandMask();

            // Generate all surname data
            console.log('Generating surname data...');
            this.allSurnameData = DATA.generateSurnamePointsData();
            console.log('Surname data generated:', Object.keys(this.allSurnameData).length, 'surnames');
            
            // Combine all selected surnames into one layer
            this.updateSurnameLayer();
            console.log('Surname layer updated');
        
        // Add other sources
        this.map.addSource('synagogues-data', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        
        this.map.addSource('billionaires-data', {
            type: 'geojson',
            data: DATA.generateBillionairesGeoJSON()
        });
        
        this.map.addSource('schools-data', {
            type: 'geojson',
            data: DATA.generateSchoolsGeoJSON()
        });
        
        this.map.addSource('chabad-data', {
            type: 'geojson',
            data: DATA.generateChabadGeoJSON()
        });
        
        this.map.addSource('jcc-data', {
            type: 'geojson',
            data: DATA.generateJCCGeoJSON()
        });
        
        this.map.addSource('aipac-data', {
            type: 'geojson',
            data: DATA.generateAIPACGeoJSON()
        });
        
        // Add layers (surname layer first, then others on top)
        this.addSurnameLayer();
        this.addSynagogueLayer();
        this.addSchoolsLayer();
        this.addChabadLayer();
        this.addJCCLayer();
        this.addBillionaireLayer();
        this.addAIPACLayer();
        
        await this.loadSynagogueData();
        this.setupHoverHandlers();
        this.updateStats();
        
        document.getElementById('loading').classList.add('hidden');
        console.log('Initialization complete');
        } catch (error) {
            console.error('Error during map initialization:', error);
            document.getElementById('loading').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <h2>Error loading map</h2>
                    <p style="color: #a1a1aa;">${error.message}</p>
                </div>
            `;
        }
    }
    
    updateSurnameLayer() {
        // Combine selected surnames into single GeoJSON
        const features = [];
        
        for (const name of this.selectedSurnames) {
            if (this.allSurnameData[name]) {
                features.push(...this.allSurnameData[name].features);
            }
        }
        
        const combined = { type: 'FeatureCollection', features };
        
        if (this.map.getSource('surnames-data')) {
            this.map.getSource('surnames-data').setData(combined);
        } else {
            this.map.addSource('surnames-data', {
                type: 'geojson',
                data: combined
            });
        }
        
        this.updateStats();
    }
    
    addSurnameLayer() {
        // Heatmap for zoomed-out glow
        this.map.addLayer({
            id: 'surnames-heatmap',
            type: 'heatmap',
            source: 'surnames-data',
            maxzoom: 12,
            paint: {
                'heatmap-weight': CONFIG.LAYERS.heatmap.weight,
                'heatmap-intensity': CONFIG.LAYERS.heatmap.intensity,
                'heatmap-color': CONFIG.LAYERS.heatmap.colorRamp,
                'heatmap-radius': CONFIG.LAYERS.heatmap.radius,
                'heatmap-opacity': CONFIG.LAYERS.heatmap.opacity
            }
        });

        // Small crisp dots on top for close zooms
        this.map.addLayer({
            id: 'surnames',
            type: 'circle',
            source: 'surnames-data',
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    5, 1,
                    8, 1.5,
                    10, 2,
                    12, 2.5,
                    14, 3,
                    16, 4
                ],
                'circle-color': ['get', 'color', ['literal', '#1d4ed8']],
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    4, 0,
                    7, 0.4,
                    10, 0.8,
                    12, 0.95
                ],
                'circle-stroke-width': 0.5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': 0.3
            }
        });
    }
    
    addSynagogueLayer() {
        this.map.addLayer({
            id: 'synagogues',
            type: 'circle',
            source: 'synagogues-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3.5, 15, 5],
                'circle-color': '#1d4ed8',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'visible' }
        });
    }
    
    addSchoolsLayer() {
        this.map.addLayer({
            id: 'schools',
            type: 'circle',
            source: 'schools-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 4, 15, 6],
                'circle-color': '#3b82f6',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'none' }
        });
    }
    
    addChabadLayer() {
        this.map.addLayer({
            id: 'chabad',
            type: 'circle',
            source: 'chabad-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 4, 15, 6],
                'circle-color': '#60a5fa',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'none' }
        });
    }
    
    addJCCLayer() {
        this.map.addLayer({
            id: 'jcc',
            type: 'circle',
            source: 'jcc-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 5, 15, 7],
                'circle-color': '#2563eb',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'none' }
        });
    }
    
    addBillionaireLayer() {
        this.map.addLayer({
            id: 'billionaires',
            type: 'circle',
            source: 'billionaires-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['get', 'netWorth'], 5, 3, 50, 6, 180, 9],
                'circle-color': '#0ea5e9',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'none' }
        });
    }
    
    addAIPACLayer() {
        this.map.addLayer({
            id: 'aipac',
            type: 'circle',
            source: 'aipac-data',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['get', 'amount'], 100000, 3, 1000000, 5, 10000000, 8, 100000000, 12],
                'circle-color': '#38bdf8',
                'circle-opacity': 0.9,
                'circle-stroke-width': 0
            },
            layout: { visibility: 'none' }
        });
    }
    
    async loadSynagogueData() {
        console.log('Loading synagogue data...');
        
        const query = `
            [out:json][timeout:60];
            (
                node["amenity"="place_of_worship"]["religion"="jewish"](24.5,-84,43,-69);
                way["amenity"="place_of_worship"]["religion"="jewish"](24.5,-84,43,-69);
            );
            out center;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            
            if (!response.ok) throw new Error('Overpass API failed');
            const data = await response.json();
            
            const geojson = {
                type: 'FeatureCollection',
                features: data.elements.map(el => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [el.lon || el.center?.lon, el.lat || el.center?.lat]
                    },
                    properties: {
                        name: el.tags?.name || 'Unnamed Synagogue',
                        denomination: el.tags?.denomination || 'Unknown'
                    }
                })).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1])
            };
            
            console.log(`Loaded ${geojson.features.length} synagogues`);
            this.map.getSource('synagogues-data').setData(geojson);
            document.getElementById('stat-synagogues').textContent = geojson.features.length.toLocaleString();
                
        } catch (error) {
            console.error('Failed to load synagogues:', error);
            document.getElementById('stat-synagogues').textContent = '0';
        }
    }
    
    populateSurnameGrid() {
        const grid = document.getElementById('surname-grid');
        grid.innerHTML = '';
        
        DATA.TOP_SURNAMES.forEach(surname => {
            const label = document.createElement('label');
            label.className = 'surname-checkbox active';
            label.innerHTML = `
                <input type="checkbox" value="${surname.name}" checked>
                <span class="color-dot" style="background-color: ${surname.color}"></span>
                <span class="surname-name">${surname.name}</span>
            `;
            
            const checkbox = label.querySelector('input');
            checkbox.addEventListener('change', () => {
                label.classList.toggle('active', checkbox.checked);
                this.updateSelectedSurnames();
            });
            
            grid.appendChild(label);
        });
    }
    
    updateSelectedSurnames() {
        const checkboxes = document.querySelectorAll('#surname-grid input:checked');
        this.selectedSurnames = Array.from(checkboxes).map(cb => cb.value);
        this.updateSurnameLayer();
    }
    
    setupUIHandlers() {
        // Layer toggles
        const layerMappings = {
            'layer-synagogues': 'synagogues',
            'layer-billionaires': 'billionaires',
            'layer-schools': 'schools',
            'layer-chabad': 'chabad',
            'layer-jcc': 'jcc',
            'layer-aipac': 'aipac'
        };
        
        const legendMappings = {
            'layer-billionaires': 'legend-billionaires',
            'layer-schools': 'legend-schools',
            'layer-chabad': 'legend-chabad',
            'layer-jcc': 'legend-jcc',
            'layer-aipac': 'legend-aipac'
        };
        
        Object.entries(layerMappings).forEach(([inputId, layerId]) => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', (e) => {
                    if (this.map?.getLayer(layerId)) {
                        this.map.setLayoutProperty(layerId, 'visibility', e.target.checked ? 'visible' : 'none');
                    }
                    const legendId = legendMappings[inputId];
                    if (legendId) {
                        const el = document.getElementById(legendId);
                        if (el) el.style.display = e.target.checked ? 'flex' : 'none';
                    }
                });
            }
        });
        
        // Surname select all/none
        document.getElementById('select-all-surnames')?.addEventListener('click', () => {
            document.querySelectorAll('#surname-grid input').forEach(cb => {
                cb.checked = true;
                cb.closest('.surname-checkbox').classList.add('active');
            });
            this.updateSelectedSurnames();
        });
        
        document.getElementById('select-none-surnames')?.addEventListener('click', () => {
            document.querySelectorAll('#surname-grid input').forEach(cb => {
                cb.checked = false;
                cb.closest('.surname-checkbox').classList.remove('active');
            });
            this.updateSelectedSurnames();
        });
        
        // Search
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        const doSearch = () => {
            const query = searchInput.value.trim();
            if (query) this.searchLocation(query);
        };
        
        searchBtn?.addEventListener('click', doSearch);
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }
    
    async searchLocation(query) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                `access_token=${CONFIG.MAPBOX_TOKEN}&country=US&limit=1`
            );
            const data = await response.json();
            
            if (data.features?.length > 0) {
                const [lng, lat] = data.features[0].center;
                this.map.flyTo({ center: [lng, lat], zoom: 11, duration: 2000 });
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }
    
    setupHoverHandlers() {
        const layers = ['synagogues', 'billionaires', 'schools', 'chabad', 'jcc', 'aipac'];
        
        layers.forEach(layer => {
            this.map.on('mouseenter', layer, (e) => {
                this.map.getCanvas().style.cursor = 'pointer';
                const props = e.features[0].properties;
                
                let content = { title: props.name };
                
                if (layer === 'billionaires') {
                    content.meta = `${props.industry} · ${props.residence}`;
                    content.value = `$${props.netWorth}B`;
                } else if (layer === 'aipac') {
                    content.meta = `${props.industry} · ${props.city}`;
                    content.value = DATA.formatDonation(props.amount);
                } else if (layer === 'synagogues') {
                    content.meta = props.denomination;
                } else if (layer === 'schools') {
                    content.meta = `${props.type} · ${props.city}`;
                } else {
                    content.meta = props.city;
                }
                
                this.showTooltip(e, content);
            });
            
            this.map.on('mouseleave', layer, () => {
                this.map.getCanvas().style.cursor = '';
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(e, { title, meta, value }) {
        const content = this.tooltip.querySelector('.tooltip-content');
        content.innerHTML = `
            <strong>${title}</strong>
            ${meta ? `<div class="tooltip-meta">${meta}</div>` : ''}
            ${value ? `<div class="tooltip-value">${value}</div>` : ''}
        `;
        
        this.tooltip.style.left = `${e.point.x + 15}px`;
        this.tooltip.style.top = `${e.point.y - 10}px`;
        this.tooltip.classList.add('visible');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    
    updateStats() {
        // Count surname points
        let totalPoints = 0;
        for (const name of this.selectedSurnames) {
            if (this.allSurnameData?.[name]) {
                totalPoints += this.allSurnameData[name].features.length;
            }
        }
        document.getElementById('stat-records').textContent = totalPoints.toLocaleString();
        document.getElementById('stat-billionaires').textContent = DATA.BILLIONAIRES_DATA.length;
        document.getElementById('stat-aipac').textContent = DATA.AIPAC_DONORS.length;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.proxyMap = new ProxyMap();
});
