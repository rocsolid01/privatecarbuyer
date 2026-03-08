/**
 * Calculates the great-circle distance between two points (latitude and longitude) 
 * in miles using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Mock helper to simulate geocoding since we don't have a Google Maps API yet.
 */
export async function geocodeLocation(name: string): Promise<{ lat: number; lon: number } | null> {
    // Simple mock mapping for popular cities
    const cities: Record<string, { lat: number; lon: number }> = {
        'Los Angeles': { lat: 34.0522, lon: -118.2437 },
        'Orange County': { lat: 33.7175, lon: -117.8311 },
        'Riverside': { lat: 33.9533, lon: -117.3961 },
        'Phoenix': { lat: 33.4484, lon: -112.0740 },
        'Las Vegas': { lat: 36.1716, lon: -115.1391 },
    };

    const cleanName = name.replace(/,.*$/, '').trim();
    return cities[cleanName] || null;
}
