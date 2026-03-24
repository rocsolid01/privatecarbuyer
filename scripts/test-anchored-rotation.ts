// scripts/test-anchored-rotation.ts
// Verification script for city selection logic

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    'losangeles':   { lat: 34.0522,  lng: -118.2437 },
    'orangecounty': { lat: 33.7175,  lng: -117.8311 },
    'sd':           { lat: 32.7157,  lng: -117.1611 },
    'sfbay':        { lat: 37.7749,  lng: -122.4194 },
    'sacramento':   { lat: 38.5816,  lng: -121.4944 },
    'inlandempire': { lat: 34.1067,  lng: -117.5931 },
    'ventura':      { lat: 34.2805,  lng: -119.2945 },
    'bakersfield':  { lat: 35.3733,  lng: -119.0187 },
    'fresno':       { lat: 36.7378,  lng: -119.7871 },
    'modesto':      { lat: 37.6391,  lng: -120.9969 },
    'monterey':     { lat: 36.6002,  lng: -121.8947 },
    'stockton':     { lat: 37.9577,  lng: -121.2908 },
    'phoenix':      { lat: 33.4484,  lng: -112.0740 },
    'tucson':       { lat: 32.2226,  lng: -110.9747 },
    'flagstaff':    { lat: 35.1983,  lng: -111.6513 },
    'lasvegas':     { lat: 36.1716,  lng: -115.1391 },
    'reno':         { lat: 39.5296,  lng: -119.8138 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCities(timeIndex: number, batchSize: number, radius: number, homeCoords: {lat: number, lng: number}) {
    let cityPool = Object.entries(CITY_COORDS)
        .map(([name, coords]) => ({
            name,
            distance: calculateDistance(homeCoords.lat, homeCoords.lng, coords.lat, coords.lng),
        }))
        .filter(c => c.distance <= radius);

    const allCities = [...cityPool].sort((a, b) => a.distance - b.distance);

    const anchoredCount = 2;
    const anchored      = allCities.slice(0, anchoredCount).map(c => c.name);
    
    const hotZoneSize   = 15;
    const hotZone       = allCities.slice(0, hotZoneSize).map(c => c.name);
    const farSweep      = allCities.slice(hotZoneSize).map(c => c.name);

    const isFarSweep    = timeIndex % 20 === 0;
    
    // Determine the rotating pool (Far Sweep or the remainder of the Hot Zone)
    const rotatingPool  = (isFarSweep && farSweep.length > 0) 
        ? farSweep 
        : hotZone.filter(name => !anchored.includes(name));

    const rotatingBatchSize = Math.max(0, batchSize - anchored.length);
    const startIndex        = (timeIndex * rotatingBatchSize) % (rotatingPool.length || 1);

    const rotating: string[] = [];
    if (rotatingPool.length > 0) {
        for (let i = 0; i < rotatingBatchSize; i++) {
            rotating.push(rotatingPool[(startIndex + i) % rotatingPool.length]);
        }
    }

    const cities = [...anchored.slice(0, batchSize), ...rotating].slice(0, batchSize);
    return { cities, anchored, isFarSweep };
}

// Test Run
const home = CITY_COORDS['losangeles']; // LA center
const radius = 300;
const batchSize = 5;

console.log('--- Anchored Rotation Test (Home: LA, Radius: 300mi, Batch: 5) ---');

for (let i = 0; i < 25; i++) {
    const { cities, anchored, isFarSweep } = getCities(i, batchSize, radius, home);
    const farTag = isFarSweep ? '[FAR SWEEP]' : '[HOT ZONE ]';
    console.log(`Interval ${i.toString().padStart(2)}: ${farTag} -> [${cities.join(', ').padEnd(60)}] (Anchored: ${anchored.join(', ')})`);
    
    // Check if anchored are present
    const hasAnchored = anchored.every(a => cities.includes(a));
    if (!hasAnchored && batchSize >= anchored.length) {
        console.error('FAIL: Anchored cities missing!');
    }
}
