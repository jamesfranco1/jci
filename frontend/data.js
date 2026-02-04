// ============================================
// PROXY MAP - Data Generation
// Simulates geocoded voter data in ~500m cells
// ============================================

// Top 10 surnames
const TOP_SURNAMES = [
    { name: 'Cohen', weight: 0.95 },
    { name: 'Levy', weight: 0.92 },
    { name: 'Goldberg', weight: 0.92 },
    { name: 'Goldstein', weight: 0.92 },
    { name: 'Rosenberg', weight: 0.90 },
    { name: 'Friedman', weight: 0.85 },
    { name: 'Shapiro', weight: 0.90 },
    { name: 'Bernstein', weight: 0.90 },
    { name: 'Weinstein', weight: 0.90 }
];

// ============================================
// CLUSTERED POPULATION MODEL
// Creates organic point clouds (no grid artifacts)
// ============================================
const KM_PER_LAT = 110.574;
const KM_PER_LNG = 111.320;

function kmToLat(km) {
    return km / KM_PER_LAT;
}

function kmToLng(km, atLat) {
    return km / (KM_PER_LNG * Math.cos(atLat * Math.PI / 180));
}

function randomNormal() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function randomNormalClamped(maxSigma = 2.8) {
    let value = randomNormal();
    while (Math.abs(value) > maxSigma) {
        value = randomNormal();
    }
    return value;
}

// Approximate metro clusters. spreadKm ~= 1-sigma for local variation.
const POPULATION_CLUSTERS = [
    // ============ NEW YORK ============
    { id: 'nyc-manhattan', center: [40.783, -73.971], spreadKm: 1.6, baseCount: 180, intensity: 1.0, nodeCount: 11 },
    { id: 'nyc-brooklyn', center: [40.678, -73.944], spreadKm: 2.3, baseCount: 220, intensity: 0.95, nodeCount: 12 },
    { id: 'nyc-queens', center: [40.728, -73.820], spreadKm: 2.8, baseCount: 170, intensity: 0.8, nodeCount: 11 },
    { id: 'nyc-bronx', center: [40.850, -73.866], spreadKm: 1.9, baseCount: 120, intensity: 0.6, nodeCount: 9 },
    { id: 'li-nassau', center: [40.740, -73.630], spreadKm: 3.2, baseCount: 160, intensity: 0.7, nodeCount: 9, lngStretch: 1.3 },
    { id: 'li-suffolk', center: [40.860, -73.230], spreadKm: 3.8, baseCount: 110, intensity: 0.5, nodeCount: 8, lngStretch: 1.4 },
    { id: 'westchester', center: [41.030, -73.790], spreadKm: 2.6, baseCount: 120, intensity: 0.65, nodeCount: 8 },
    { id: 'rockland', center: [41.120, -74.060], spreadKm: 2.0, baseCount: 120, intensity: 0.85, nodeCount: 7 },
    { id: 'albany', center: [42.652, -73.756], spreadKm: 1.8, baseCount: 70, intensity: 0.4, nodeCount: 4 },
    { id: 'syracuse', center: [43.048, -76.148], spreadKm: 1.7, baseCount: 55, intensity: 0.35, nodeCount: 4 },
    { id: 'rochester', center: [43.156, -77.608], spreadKm: 1.8, baseCount: 70, intensity: 0.4, nodeCount: 4 },
    { id: 'buffalo', center: [42.886, -78.878], spreadKm: 1.8, baseCount: 60, intensity: 0.35, nodeCount: 4 },
    
    // ============ PENNSYLVANIA ============
    { id: 'philly', center: [39.952, -75.165], spreadKm: 2.6, baseCount: 170, intensity: 0.75, nodeCount: 7 },
    { id: 'montgomery', center: [40.150, -75.250], spreadKm: 2.8, baseCount: 140, intensity: 0.7, nodeCount: 6 },
    { id: 'bucks', center: [40.300, -75.050], spreadKm: 2.4, baseCount: 90, intensity: 0.55, nodeCount: 5 },
    { id: 'pittsburgh', center: [40.440, -79.995], spreadKm: 2.2, baseCount: 90, intensity: 0.55, nodeCount: 5 },
    { id: 'allentown', center: [40.608, -75.490], spreadKm: 1.7, baseCount: 50, intensity: 0.4, nodeCount: 4 },
    { id: 'harrisburg', center: [40.273, -76.886], spreadKm: 1.6, baseCount: 40, intensity: 0.35, nodeCount: 3 },

    // ============ DC / MARYLAND ============
    { id: 'dc-core', center: [38.907, -77.037], spreadKm: 2.6, baseCount: 160, intensity: 0.7, nodeCount: 6 },
    { id: 'dc-suburbs', center: [39.050, -77.120], spreadKm: 3.0, baseCount: 170, intensity: 0.7, nodeCount: 7 },
    { id: 'baltimore', center: [39.290, -76.612], spreadKm: 2.2, baseCount: 150, intensity: 0.75, nodeCount: 6 },
    
    // ============ FLORIDA ============
    { id: 'miami-beach', center: [25.790, -80.130], spreadKm: 1.8, baseCount: 120, intensity: 0.9, nodeCount: 5 },
    { id: 'miami', center: [25.761, -80.191], spreadKm: 2.5, baseCount: 140, intensity: 0.7, nodeCount: 6 },
    { id: 'aventura', center: [25.956, -80.139], spreadKm: 1.5, baseCount: 90, intensity: 0.85, nodeCount: 4 },
    { id: 'fort-lauderdale', center: [26.122, -80.137], spreadKm: 2.4, baseCount: 130, intensity: 0.65, nodeCount: 6 },
    { id: 'boca', center: [26.368, -80.128], spreadKm: 2.0, baseCount: 130, intensity: 0.8, nodeCount: 5 },
    { id: 'delray', center: [26.461, -80.072], spreadKm: 1.8, baseCount: 90, intensity: 0.6, nodeCount: 4 },
    { id: 'west-palm', center: [26.715, -80.053], spreadKm: 2.1, baseCount: 90, intensity: 0.55, nodeCount: 4 },
    { id: 'orlando', center: [28.538, -81.379], spreadKm: 2.3, baseCount: 80, intensity: 0.4, nodeCount: 4 },
    { id: 'tampa', center: [27.950, -82.457], spreadKm: 2.1, baseCount: 70, intensity: 0.35, nodeCount: 4 },
    { id: 'jacksonville', center: [30.332, -81.655], spreadKm: 2.0, baseCount: 60, intensity: 0.3, nodeCount: 3 },
    
    // ============ MASSACHUSETTS ============
    { id: 'boston', center: [42.360, -71.058], spreadKm: 2.0, baseCount: 130, intensity: 0.6, nodeCount: 6 },
    { id: 'brookline', center: [42.331, -71.121], spreadKm: 1.6, baseCount: 120, intensity: 0.8, nodeCount: 5 },
    { id: 'newton', center: [42.337, -71.209], spreadKm: 1.9, baseCount: 110, intensity: 0.75, nodeCount: 5 },
    { id: 'cambridge', center: [42.373, -71.109], spreadKm: 1.7, baseCount: 100, intensity: 0.6, nodeCount: 5 },
    { id: 'lexington', center: [42.447, -71.227], spreadKm: 2.0, baseCount: 80, intensity: 0.5, nodeCount: 4 },
    { id: 'metrowest', center: [42.280, -71.420], spreadKm: 2.4, baseCount: 90, intensity: 0.55, nodeCount: 4 },
    { id: 'north-shore', center: [42.540, -70.920], spreadKm: 2.2, baseCount: 90, intensity: 0.55, nodeCount: 4 },
    { id: 'worcester', center: [42.262, -71.802], spreadKm: 1.8, baseCount: 60, intensity: 0.35, nodeCount: 3 },
    { id: 'springfield', center: [42.101, -72.590], spreadKm: 1.6, baseCount: 45, intensity: 0.3, nodeCount: 3 }
];

const CLUSTER_NODES = POPULATION_CLUSTERS.reduce((acc, cluster) => {
    const nodes = [];
    const [centerLat, centerLng] = cluster.center;
    const nodeCount = cluster.nodeCount || 5;

    for (let i = 0; i < nodeCount; i += 1) {
        const lat = centerLat + kmToLat(randomNormalClamped() * cluster.spreadKm * 0.9);
        const lng = centerLng + kmToLng(randomNormalClamped() * cluster.spreadKm * 0.9, centerLat);
        nodes.push({ lat, lng });
    }

    acc[cluster.id] = nodes;
    return acc;
}, {});

const WATER_EXCLUSION_ZONES = [
    // NYC / NY Harbor / East River / Hudson River (approximate boxes)
    { minLat: 40.66, maxLat: 40.72, minLng: -74.08, maxLng: -73.93 }, // Harbor
    { minLat: 40.70, maxLat: 40.87, minLng: -74.06, maxLng: -73.98 }, // Hudson River
    { minLat: 40.69, maxLat: 40.82, minLng: -74.02, maxLng: -73.90 }, // East River
    { minLat: 40.56, maxLat: 40.68, minLng: -73.98, maxLng: -73.78 }, // Jamaica Bay
    // Long Island Sound / South Shore
    { minLat: 40.90, maxLat: 41.15, minLng: -73.95, maxLng: -73.30 },
    { minLat: 40.50, maxLat: 40.65, minLng: -74.02, maxLng: -73.55 }
];

function isInExclusionZone(lat, lng) {
    return WATER_EXCLUSION_ZONES.some(zone =>
        lat >= zone.minLat &&
        lat <= zone.maxLat &&
        lng >= zone.minLng &&
        lng <= zone.maxLng
    );
}

let LAND_MASK_INDEX = [];
let CLUSTER_NODES_LAND = {};

function buildLandMaskIndex(geojson) {
    const index = [];
    if (!geojson?.features?.length) return index;

    geojson.features.forEach(feature => {
        const geom = feature.geometry;
        if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return;

        const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        polygons.forEach(poly => {
            poly.forEach(ring => {
                ring.forEach(([x, y]) => {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                });
            });
        });

        index.push({
            bbox: [minX, minY, maxX, maxY],
            polygons
        });
    });

    return index;
}

function pointInRing(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function pointInPolygon(point, polygon) {
    if (!polygon.length) return false;
    if (!pointInRing(point, polygon[0])) return false;
    for (let i = 1; i < polygon.length; i += 1) {
        if (pointInRing(point, polygon[i])) return false;
    }
    return true;
}

function isPointOnLand(lat, lng) {
    if (!LAND_MASK_INDEX.length) return true;
    const point = [lng, lat];

    for (const entry of LAND_MASK_INDEX) {
        const [minX, minY, maxX, maxY] = entry.bbox;
        if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
        for (const poly of entry.polygons) {
            if (pointInPolygon(point, poly)) return true;
        }
    }

    return false;
}

function isPointAllowed(lat, lng) {
    if (LAND_MASK_INDEX.length) {
        return isPointOnLand(lat, lng);
    }
    if (isInExclusionZone(lat, lng)) return false;
    return true;
}

function rebuildLandNodes() {
    CLUSTER_NODES_LAND = Object.fromEntries(
        Object.entries(CLUSTER_NODES).map(([id, nodes]) => {
            const landNodes = nodes.filter(node => isPointAllowed(node.lat, node.lng));
            return [id, landNodes.length ? landNodes : nodes];
        })
    );
}

async function loadLandMask() {
    // Disabled: land mask was too large and froze the browser.
    // Using simple water exclusion zones instead.
    console.log('Land mask disabled, using water exclusion zones.');
    LAND_MASK_INDEX = [];
    return null;
}

function sampleClusterPoint(cluster, maxAttempts = 20) {
    const nodes = CLUSTER_NODES_LAND[cluster.id] || CLUSTER_NODES[cluster.id];
    const lngStretch = cluster.lngStretch || 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const node = nodes[Math.floor(Math.random() * nodes.length)];
        const useRegional = Math.random() < 0.35;
        const baseSigma = useRegional ? 1.1 : 0.5;
        const sigmaLat = cluster.spreadKm * baseSigma;
        const sigmaLng = cluster.spreadKm * baseSigma * lngStretch;

        const lat = node.lat + kmToLat(randomNormalClamped() * sigmaLat) + kmToLat((Math.random() - 0.5) * 0.3);
        const lng = node.lng + kmToLng(randomNormalClamped() * sigmaLng, node.lat) + kmToLng((Math.random() - 0.5) * 0.3, node.lat);

        if (isPointAllowed(lat, lng)) {
            return { lat, lng };
        }
    }

    return null;
}

const MIN_POINT_DISTANCE_KM = 0.12;
const HASH_CELL_KM = MIN_POINT_DISTANCE_KM;

function pointToKm(lat, lng) {
    const y = lat * KM_PER_LAT;
    const x = lng * KM_PER_LNG * Math.cos(lat * Math.PI / 180);
    return { x, y };
}

function getHashKey(x, y) {
    const col = Math.floor(x / HASH_CELL_KM);
    const row = Math.floor(y / HASH_CELL_KM);
    return `${col}:${row}`;
}

function canPlacePoint(hash, lat, lng) {
    const { x, y } = pointToKm(lat, lng);
    const col = Math.floor(x / HASH_CELL_KM);
    const row = Math.floor(y / HASH_CELL_KM);

    for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
            const key = `${col + dx}:${row + dy}`;
            const points = hash.get(key);
            if (!points) continue;
            for (const point of points) {
                const distX = x - point.x;
                const distY = y - point.y;
                if (distX * distX + distY * distY < MIN_POINT_DISTANCE_KM * MIN_POINT_DISTANCE_KM) {
                    return false;
                }
            }
        }
    }

    return true;
}

function storePoint(hash, lat, lng) {
    const { x, y } = pointToKm(lat, lng);
    const key = getHashKey(x, y);
    if (!hash.has(key)) {
        hash.set(key, []);
    }
    hash.get(key).push({ x, y });
}

// Initialize land-aware nodes (without mask this just mirrors base nodes)
rebuildLandNodes();

// Generate points from cells
function generateSurnamePointsData() {
    const data = {};
    
    for (const surname of TOP_SURNAMES) {
        const features = [];
        const spatialHash = new Map();

        for (const cluster of POPULATION_CLUSTERS) {
            const weight = cluster.intensity * surname.weight;
            const variability = 0.65 + Math.random() * 0.7;
            const count = Math.max(0, Math.round(cluster.baseCount * weight * variability));

            for (let i = 0; i < count; i += 1) {
                let point = null;
                for (let attempt = 0; attempt < 12; attempt += 1) {
                    const candidate = sampleClusterPoint(cluster);
                    if (!candidate) continue;
                    if (canPlacePoint(spatialHash, candidate.lat, candidate.lng)) {
                        storePoint(spatialHash, candidate.lat, candidate.lng);
                        point = candidate;
                        break;
                    }
                }

                if (!point) continue;
                const { lat, lng } = point;
                
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: { surname: surname.name }
                });
            }
        }
        
        data[surname.name] = { type: 'FeatureCollection', features };
    }
    
    return data;
}

// Combined data for all surnames
function generateGridData(selectedSurnames = null) {
    const features = [];
    const surnames = selectedSurnames?.length > 0 
        ? TOP_SURNAMES.filter(s => selectedSurnames.includes(s.name))
        : TOP_SURNAMES;
    const spatialHash = new Map();
    
    for (const cluster of POPULATION_CLUSTERS) {
        for (const surname of surnames) {
            const weight = cluster.intensity * surname.weight;
            const variability = 0.65 + Math.random() * 0.7;
            const count = Math.max(0, Math.round(cluster.baseCount * weight * variability));

            for (let i = 0; i < count; i += 1) {
                let point = null;
                    for (let attempt = 0; attempt < 12; attempt += 1) {
                        const candidate = sampleClusterPoint(cluster);
                        if (!candidate) continue;
                        if (canPlacePoint(spatialHash, candidate.lat, candidate.lng)) {
                            storePoint(spatialHash, candidate.lat, candidate.lng);
                            point = candidate;
                            break;
                        }
                    }

                if (!point) continue;
                const { lat, lng } = point;
                
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: { surname: surname.name }
                });
            }
        }
    }
    
    return { type: 'FeatureCollection', features };
}

// ============================================
// BILLIONAIRE DATA (Real - Forbes 400)
// ============================================
const BILLIONAIRES_DATA = [
    { name: 'Michael Bloomberg', lat: 40.7614, lng: -73.9776, netWorth: 106, industry: 'Media/Finance', residence: 'Manhattan, NY' },
    { name: 'Steve Cohen', lat: 41.0534, lng: -73.5387, netWorth: 17.5, industry: 'Hedge Funds', residence: 'Greenwich, CT' },
    { name: 'Carl Icahn', lat: 40.7831, lng: -73.9712, netWorth: 7.1, industry: 'Investments', residence: 'Manhattan, NY' },
    { name: 'George Soros', lat: 41.0471, lng: -73.5485, netWorth: 6.7, industry: 'Hedge Funds', residence: 'Katonah, NY' },
    { name: 'Ray Dalio', lat: 41.0534, lng: -73.6234, netWorth: 15.4, industry: 'Hedge Funds', residence: 'Greenwich, CT' },
    { name: 'David Tepper', lat: 25.7907, lng: -80.1300, netWorth: 18.5, industry: 'Hedge Funds', residence: 'Miami Beach, FL' },
    { name: 'Ken Griffin', lat: 25.7617, lng: -80.1918, netWorth: 35, industry: 'Hedge Funds', residence: 'Miami, FL' },
    { name: 'Stephen Schwarzman', lat: 40.7614, lng: -73.9651, netWorth: 36, industry: 'Private Equity', residence: 'Manhattan, NY' },
    { name: 'Leonard Lauder', lat: 40.7831, lng: -73.9626, netWorth: 26.3, industry: 'Cosmetics', residence: 'Manhattan, NY' },
    { name: 'Thomas Peterffy', lat: 26.7056, lng: -80.0364, netWorth: 25, industry: 'Finance', residence: 'Palm Beach, FL' },
];

function generateBillionairesGeoJSON() {
    return {
        type: 'FeatureCollection',
        features: BILLIONAIRES_DATA.map((b, i) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
            properties: { id: i, name: b.name, netWorth: b.netWorth, industry: b.industry, residence: b.residence }
        }))
    };
}

// ============================================
// OTHER INSTITUTION DATA
// ============================================
const CHABAD_LOCATIONS = [
    { lat: 40.7580, lng: -73.9855, name: 'Chabad Midtown', city: 'Manhattan' },
    { lat: 40.6782, lng: -73.9442, name: 'Chabad Crown Heights', city: 'Brooklyn' },
    { lat: 40.7429, lng: -73.6138, name: 'Chabad Great Neck', city: 'Great Neck' },
    { lat: 26.3683, lng: -80.1289, name: 'Chabad Boca', city: 'Boca Raton' },
    { lat: 25.7907, lng: -80.1300, name: 'Chabad Miami Beach', city: 'Miami Beach' },
    { lat: 42.3463, lng: -71.1526, name: 'Chabad Brookline', city: 'Brookline' },
    { lat: 39.9526, lng: -75.1652, name: 'Chabad Philadelphia', city: 'Philadelphia' },
];

const JEWISH_SCHOOLS = [
    { lat: 40.6782, lng: -73.9442, name: 'Yeshiva of Flatbush', city: 'Brooklyn', type: 'Orthodox' },
    { lat: 40.7580, lng: -73.9855, name: 'Ramaz School', city: 'Manhattan', type: 'Modern Orthodox' },
    { lat: 26.3683, lng: -80.1289, name: 'Donna Klein Jewish Academy', city: 'Boca Raton', type: 'Community' },
    { lat: 42.3463, lng: -71.1526, name: 'Maimonides School', city: 'Brookline', type: 'Modern Orthodox' },
    { lat: 39.9526, lng: -75.1652, name: 'Jack M. Barrack Hebrew Academy', city: 'Philadelphia', type: 'Community' },
];

const JCC_LOCATIONS = [
    { lat: 40.7831, lng: -73.9581, name: '92nd Street Y', city: 'Manhattan' },
    { lat: 26.3683, lng: -80.1289, name: 'Levis JCC', city: 'Boca Raton' },
    { lat: 42.3355, lng: -71.2141, name: 'JCC Greater Boston', city: 'Newton' },
    { lat: 39.9526, lng: -75.1652, name: 'Kaiserman JCC', city: 'Philadelphia' },
];

const AIPAC_DONORS = [
    { name: 'Miriam Adelson', lat: 36.1699, lng: -115.1398, amount: 100000000, city: 'Las Vegas', industry: 'Casinos' },
    { name: 'Paul Singer', lat: 40.7614, lng: -73.9712, amount: 24600000, city: 'Manhattan', industry: 'Hedge Funds' },
    { name: 'Bernard Marcus', lat: 33.8463, lng: -84.3621, amount: 18500000, city: 'Atlanta', industry: 'Retail' },
    { name: 'Seth Klarman', lat: 42.3463, lng: -71.1526, amount: 12000000, city: 'Brookline', industry: 'Hedge Funds' },
    { name: 'Ken Griffin', lat: 25.7617, lng: -80.1918, amount: 8000000, city: 'Miami', industry: 'Hedge Funds' },
];

function generateChabadGeoJSON() {
    return { type: 'FeatureCollection', features: CHABAD_LOCATIONS.map((c, i) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: { id: i, name: c.name, city: c.city }
    }))};
}

function generateSchoolsGeoJSON() {
    return { type: 'FeatureCollection', features: JEWISH_SCHOOLS.map((s, i) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { id: i, name: s.name, city: s.city, type: s.type }
    }))};
}

function generateJCCGeoJSON() {
    return { type: 'FeatureCollection', features: JCC_LOCATIONS.map((j, i) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [j.lng, j.lat] },
        properties: { id: i, name: j.name, city: j.city }
    }))};
}

function generateAIPACGeoJSON() {
    return { type: 'FeatureCollection', features: AIPAC_DONORS.map((d, i) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: { id: i, name: d.name, amount: d.amount, city: d.city, industry: d.industry }
    }))};
}

function formatDonation(amount) {
    return amount >= 1000000 ? `$${(amount / 1000000).toFixed(1)}M` : `$${(amount / 1000).toFixed(0)}K`;
}

// Backwards compat
const POPULATION_CENTERS = [];

window.DATA = {
    TOP_SURNAMES,
    POPULATION_CENTERS,
    BILLIONAIRES_DATA,
    CHABAD_LOCATIONS,
    JEWISH_SCHOOLS,
    JCC_LOCATIONS,
    AIPAC_DONORS,
    generateSurnamePointsData,
    generateGridData,
    generateBillionairesGeoJSON,
    generateChabadGeoJSON,
    generateSchoolsGeoJSON,
    generateJCCGeoJSON,
    generateAIPACGeoJSON,
    formatDonation,
    loadLandMask
};
