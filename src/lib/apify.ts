import { Settings } from '@/types/database';

declare var process: { env: { APIFY_TOKEN?: string } };

// Mapping of common Craigslist subdomains to coordinates
const CITY_COORDS: Record<string, { lat: number, lng: number }> = {
    // California
    'losangeles': { lat: 34.0522, lng: -118.2437 },
    'orangecounty': { lat: 33.7175, lng: -117.8311 },
    'phoenix': { lat: 33.4484, lng: -112.0740 },
    'sd': { lat: 32.7157, lng: -117.1611 },
    'sfbay': { lat: 37.7749, lng: -122.4194 },
    'sacramento': { lat: 38.5816, lng: -121.4944 },
    'lasvegas': { lat: 36.1716, lng: -115.1391 },
    'inlandempire': { lat: 34.1067, lng: -117.5931 },
    'ventura': { lat: 34.2805, lng: -119.2945 },
    'santa-barbara': { lat: 34.4208, lng: -119.6982 },
    'bakersfield': { lat: 35.3733, lng: -119.0187 },
    'chico': { lat: 39.7285, lng: -121.8375 },
    'fresno': { lat: 36.7378, lng: -119.7871 },
    'goldcountry': { lat: 38.2466, lng: -120.8408 },
    'hanford': { lat: 36.3274, lng: -119.6457 },
    'humboldt': { lat: 40.7450, lng: -123.8695 },
    'imperial': { lat: 32.8412, lng: -115.5699 },
    'mendocino': { lat: 39.3077, lng: -123.7995 },
    'merced': { lat: 37.3022, lng: -120.4830 },
    'modesto': { lat: 37.6391, lng: -120.9969 },
    'monterey': { lat: 36.6002, lng: -121.8947 },
    'redding': { lat: 40.5833, lng: -122.3917 },
    'reno': { lat: 39.5296, lng: -119.8138 },
    'slo': { lat: 35.2828, lng: -120.6596 },
    'stockton': { lat: 37.9577, lng: -121.2908 },
    'susanville': { lat: 40.4163, lng: -120.6530 },
    'visalia': { lat: 36.3302, lng: -119.2921 },
    'yubasutter': { lat: 39.1404, lng: -121.6169 },
    'palmsprings': { lat: 33.8303, lng: -116.5453 },
    // Arizona
    'flagstaff': { lat: 35.1983, lng: -111.6513 },
    'mohave': { lat: 35.1894, lng: -114.0530 },
    'prescott': { lat: 34.5400, lng: -112.4685 },
    'showlow': { lat: 34.2509, lng: -110.0298 },
    'sierravista': { lat: 31.5545, lng: -110.3037 },
    'tucson': { lat: 32.2226, lng: -110.9747 },
    'yuma': { lat: 32.6927, lng: -114.6277 },
    // Default
    'default': { lat: 34.0522, lng: -118.2437 }
};

/**
 * Calculates distance between two points in miles using Haversine formula.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Approximate coordinates for a ZIP code (very basic lookup for MVP).
 * In a production app, use Google Geocoding or a Zip-to-LatLong library.
 */
function getZipCoords(zip: string): { lat: number, lng: number } {
    // Basic mapping for Southern California / Phoenix area
    if (zip.startsWith('900') || zip.startsWith('902')) return CITY_COORDS['losangeles'];
    if (zip.startsWith('926') || zip.startsWith('927')) return CITY_COORDS['orangecounty'];
    if (zip.startsWith('850') || zip.startsWith('852')) return CITY_COORDS['phoenix'];
    if (zip.startsWith('921')) return CITY_COORDS['sd'];
    if (zip.startsWith('941')) return CITY_COORDS['sfbay'];
    return CITY_COORDS['default'];
}

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0"
];

const RESOLUTIONS = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 }
];

function getRandomFingerprint() {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = RESOLUTIONS[Math.floor(Math.random() * RESOLUTIONS.length)];
    return { userAgent: ua, screen: res };
}

/**
 * Maps dealership settings to the input format required by the
 * fatihtahta/craigslist-scraper actor.
 */
export function getApifyActorInput(settings: Settings, isDeepScrape = false) {
    const currentCity = settings.locations[0] || 'losangeles';

    // We use queries for keywords and startUrls for the specific category search
    const startUrls = [{
        url: `https://${currentCity}.craigslist.org/search/cto?purveyor=owner&sort=date&min_auto_year=${settings.year_min}&max_auto_year=${settings.year_max}&min_price=${settings.price_min}&max_price=${settings.price_max}&max_auto_miles=${settings.mileage_max}`
    }];

    const allQueries = (settings.makes || [])
        .concat(settings.models || [])
        .concat(settings.condition_include || [])
        .concat(settings.motivation_keywords || []);

    return {
        startUrls: startUrls.map(s => s.url),
        queries: allQueries,
        maxItems: isDeepScrape ? 50 : 8, // Economy Mode: Small batches to save cost
        proxyConfiguration: {
            useApifyProxy: true
        }
    };
}

export async function runScraper(settings: Settings, isDeepScrape = false, force = false) {
    const APIFY_TOKEN = typeof process !== 'undefined' ? process.env.APIFY_TOKEN : null;
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_TOKEN is not configured');
    }

    // 1. Smart Sleep & Pulse Logic: Pulse every X Minutes (User Defined)
    const pulseInterval = settings.pulse_interval ?? 15;
    const now = new Date();
    const currentHour = now.getHours();

    // 2. Dynamic Active Window (Defined in Settings)
    const activeStart = settings.active_hour_start ?? 7;
    const activeEnd = settings.active_hour_end ?? 22;

    if (currentHour < activeStart || currentHour >= activeEnd && !force) {
        console.log(`[Smart Sleep] Night mode (${activeEnd}PM-${activeStart}AM). Skipping pulse.`);
        return { success: false, reason: 'sleeping', wait: (currentHour < activeStart ? (activeStart - currentHour) : (24 - currentHour + activeStart)) * 60 - now.getMinutes() };
    }

    const lastRun = settings.updated_at ? new Date(settings.updated_at) : new Date(0);
    const diffMins = (now.getTime() - lastRun.getTime()) / (1000 * 60);

    if (diffMins < pulseInterval && !force) {
        const remaining = Math.ceil(pulseInterval - diffMins);
        console.warn(`Tiered Sniper cooldown. Next pulse in: ${remaining} mins.`);
        return { success: false, reason: 'cooldown', wait: remaining };
    }

    // 3. Dynamic Radar Discovery & Tiering
    const homeCoords = getZipCoords(settings.zip || '90001');
    const radiusMiles = settings.radius ?? 200;

    const allCities = Object.entries(CITY_COORDS)
        .filter(([name]) => name !== 'default')
        .map(([name, coords]) => ({
            name,
            distance: calculateDistance(homeCoords.lat, homeCoords.lng, coords.lat, coords.lng)
        }))
        .filter(city => city.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);

    if (allCities.length === 0) allCities.push({ name: 'losangeles', distance: 0 });

    // Split into Tiers: Top 15 closest vs Remote
    const hotZoneSize = 15;
    const hotZone = allCities.slice(0, hotZoneSize).map(c => c.name);
    const regionalRadar = allCities.slice(hotZoneSize).map(c => c.name);

    // 4. Pulse Mode Selection (Far sweep every 5 hours / 20 pulses)
    const timeIndex = Math.floor(Date.now() / (pulseInterval * 60 * 1000));
    const isFarSweep = timeIndex % 20 === 0; // Every 5 hours

    const batchSize = settings.batch_size ?? 5;
    const currentPool = (isFarSweep && regionalRadar.length > 0) ? regionalRadar : hotZone;
    const startIndex = (timeIndex * batchSize) % currentPool.length;

    const rotateCities = [];
    for (let i = 0; i < batchSize; i++) {
        rotateCities.push(currentPool[(startIndex + i) % currentPool.length]);
    }

    console.log(`[Tiered Sniper] Mode: ${isFarSweep ? 'FAR SWEEP' : 'HOT ZONE'}. Batch: [${rotateCities.join(', ')}]`);

    // 5. Initialize Scrape Run Record
    let runId: string | null = null;
    try {
        const { data: run, error: runError } = await (require('@/lib/supabase').supabase)
            .from('scrape_runs')
            .insert({
                dealer_id: settings.id,
                mode: isFarSweep ? 'FAR SWEEP' : 'HOT ZONE',
                cities: rotateCities,
                status: 'Pending'
            })
            .select()
            .single();

        if (!runError && run) runId = run.id;
    } catch (err) {
        console.error('[Sniper] Failed to log run start:', err);
    }

    // Trigger the Pulse
    (async () => {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rotateCities.length; i++) {
            // Check for Abort Signal
            if (runId) {
                const { data: currentRun } = await (require('@/lib/supabase').supabase)
                    .from('scrape_runs')
                    .select('status')
                    .eq('id', runId)
                    .single();

                if (currentRun?.status === 'Aborted') {
                    console.log(`[Sniper] Run ${runId} aborted by user. Terminating loop.`);
                    return;
                }
            }

            const city = rotateCities[i];
            const citySettings = { ...settings, locations: [city] };

            // Sniper Settings: catchment size based on user preference
            const input = {
                ...getApifyActorInput(citySettings, isDeepScrape),
                maxItems: isDeepScrape ? 50 : (settings.max_items_per_city ?? 2)
            };

            try {
                const response = await fetch(`https://api.apify.com/v2/acts/fatihtahta~craigslist-scraper/runs?token=${APIFY_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });
                if (response.ok) successCount++;
                else errorCount++;
            } catch (err) {
                console.error(`[Sniper] Failed to trigger ${city}:`, err);
                errorCount++;
            }

            if (i < rotateCities.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // Finalize Scrape Run Record
        if (runId) {
            await (require('@/lib/supabase').supabase)
                .from('scrape_runs')
                .update({
                    finished_at: new Date().toISOString(),
                    status: errorCount === 0 ? 'Success' : (successCount > 0 ? 'Partial' : 'Error'),
                    error_message: errorCount > 0 ? `${errorCount} cities failed to trigger.` : null
                })
                .eq('id', runId);
        }
    })();

    return {
        success: true,
        message: `${isFarSweep ? 'Far Sweep' : 'Sniper Pulse'} started for ${rotateCities.join(', ')}.`
    };
}

/**
 * Triggers a one-off deep extraction for a specific listing.
 */
export async function runDeepScrape(listingUrl: string) {
    const APIFY_TOKEN = typeof process !== 'undefined' ? process.env.APIFY_TOKEN : null;
    if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN is not configured');

    const input = {
        startUrls: [listingUrl],
        maxItems: 1,
        proxyConfiguration: {
            useApifyProxy: true
        }
    };

    const response = await fetch(`https://api.apify.com/v2/acts/fatihtahta~craigslist-scraper/runs?token=${APIFY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Deep Extraction Failed: ${error.error?.message || response.statusText}`);
    }

    return { success: true };
}
