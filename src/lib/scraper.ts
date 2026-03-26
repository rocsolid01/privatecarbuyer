/**
 * src/lib/scraper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel-side scraper orchestrator — replaces apify.ts.
 *
 * This module contains ALL the existing logic:
 *   • Budget guardrail (daily_budget_usd)
 *   • Smart sleep (active_hour_start / active_hour_end)
 *   • Cooldown (pulse_interval, last_pulse_at)
 *   • Tiered city targeting (Hot Zone / Far Sweep)
 *   • Scrape run DB record management
 *
 * The ONLY change from apify.ts: the actual trigger call now POSTs to
 * the AWS Lambda API Gateway instead of the Apify REST API.
 *
 * The Lambda handles the scraping + Supabase upsert directly,
 * so no webhook round-trip is needed for the main scrape flow.
 */

import { Settings } from '@/types/database';
import { supabase, adminSupabase } from '@/lib/supabase';

declare var process: {
    cwd: () => string;
    env: {
        LAMBDA_SCRAPER_URL?: string;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// City coordinate map (for radius-based city targeting — same as before)
// ─────────────────────────────────────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    // California
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
    // Arizona
    'phoenix':      { lat: 33.4484,  lng: -112.0740 },
    'tucson':       { lat: 32.2226,  lng: -110.9747 },
    'flagstaff':    { lat: 35.1983,  lng: -111.6513 },
    // Nevada
    'lasvegas':     { lat: 36.1716,  lng: -115.1391 },
    'reno':         { lat: 39.5296,  lng: -119.8138 },
    // Default fallback
    'default':      { lat: 34.0522,  lng: -118.2437 },
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

function getZipCoords(zip: string): { lat: number; lng: number } {
    if (zip.startsWith('900') || zip.startsWith('902')) return CITY_COORDS['losangeles'];
    if (zip.startsWith('926') || zip.startsWith('927')) return CITY_COORDS['orangecounty'];
    if (zip.startsWith('850') || zip.startsWith('852')) return CITY_COORDS['phoenix'];
    if (zip.startsWith('921'))                           return CITY_COORDS['sd'];
    if (zip.startsWith('941'))                           return CITY_COORDS['sfbay'];
    return CITY_COORDS['default'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main run trigger — replaces runScraper() from apify.ts
// ─────────────────────────────────────────────────────────────────────────────
export async function runScraper(settings: Settings, isDeepScrape = false) {
    const now = new Date();
    const LAMBDA_URL = typeof process !== 'undefined' ? process.env.LAMBDA_SCRAPER_URL : null;

    if (!LAMBDA_URL) {
        throw new Error('LAMBDA_SCRAPER_URL is not configured. Add it to your .env file after deploying the Lambda.');
    }

    // ── 1. Smart Sleep Guard ──────────────────────────────────────────────
    // Use America/Los_Angeles time for the sleep check to match user's local active hours
    const laTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        hour12: false
    }).format(now);
    
    const currentHour = parseInt(laTime);
    const startHour = settings.active_hour_start ?? 0;
    const endHour = settings.active_hour_end ?? 24;

    if (currentHour < startHour || currentHour >= endHour) {
        console.log(`[Tiered Sniper] 💤 SYSTEM SLEEP (Active: ${startHour}:00 - ${endHour}:00 | Current: ${currentHour}:00 LA)`);
        return { success: true, message: `System is in sleep mode (Local LA Time: ${currentHour}:00).` };
    }

    // ── 2. Budget Guardrail ───────────────────────────────────────────────
    const dailyBudget = settings.daily_budget_usd ?? 1.0;
    const spentToday = settings.budget_spent_today ?? 0;

    if (spentToday >= dailyBudget) {
        console.log(`[Tiered Sniper] 🛑 BUDGET LIMIT REACHED ($${spentToday} >= $${dailyBudget})`);
        return { success: true, message: 'Daily budget limit reached.' };
    }

    // ── Tiered City Selection ─────────────────────────────────────────────
    const homeCoords  = getZipCoords(settings.zip || '90001');
    const radiusMiles = settings.radius ?? 200;

    // Base pool: Filter all potential cities (manual or geographic) by radius
    let cityPool = (settings.locations && settings.locations.length > 0)
        ? settings.locations
            .map(name => ({
                name,
                distance: CITY_COORDS[name]?.lat 
                    ? calculateDistance(homeCoords.lat, homeCoords.lng, CITY_COORDS[name].lat, CITY_COORDS[name].lng)
                    : 9999, // Unknown cities are pushed to the end
            }))
            .filter(c => c.distance <= radiusMiles)
        : Object.entries(CITY_COORDS)
            .filter(([name]) => name !== 'default')
            .map(([name, coords]) => ({
                name,
                distance: calculateDistance(homeCoords.lat, homeCoords.lng, coords.lat, coords.lng),
            }))
            .filter(c => c.distance <= radiusMiles);

    if (cityPool.length === 0) {
        cityPool.push({ 
            name: settings.locations?.[0] || 'losangeles', 
            distance: 0 
        });
    }
    
    const allCities = [...cityPool].sort((a, b) => a.distance - b.distance);

    // -- Persistent Anchored Rotation Strategy --
    // 1. "Anchored"      = 2 closest cities (always included every pulse)
    // 2. "Rotating Pool" = remaining cities sorted closest-first
    //
    // We read last_city_index from the DB so BOTH manual and 30-min scrapes
    // share the same sequential position — no city is skipped or repeated
    // just because a manual run fired mid-cycle.
    
    const anchoredCount     = 2;
    const anchored          = allCities.slice(0, anchoredCount).map(c => c.name);
    const batchSize         = settings.batch_size ?? 5;
    const rotatingBatchSize = Math.max(0, batchSize - anchoredCount);

    // Pool: everything beyond the anchored cities, closest-first
    const rotatingPool = allCities.slice(anchoredCount).map(c => c.name);

    // Read the persistent index (defaults to 0 if column not yet populated)
    const startIndex = typeof settings.last_city_index === 'number'
        ? settings.last_city_index
        : 0;

    // Advance and wrap the index, then persist it immediately before triggering
    const nextIndex = rotatingPool.length > 0
        ? (startIndex + rotatingBatchSize) % rotatingPool.length
        : 0;

    try {
        await adminSupabase
            .from('settings')
            .update({ last_city_index: nextIndex })
            .eq('id', settings.id);
    } catch (idxErr: any) {
        console.error('[City Rotation] Failed to persist last_city_index:', idxErr.message);
    }

    // Pick rotating cities starting at startIndex
    const rotating: string[] = [];
    if (rotatingPool.length > 0 && rotatingBatchSize > 0) {
        for (let i = 0; i < rotatingBatchSize; i++) {
            rotating.push(rotatingPool[(startIndex + i) % rotatingPool.length]);
        }
    }

    // Final set: anchored first (closest), then rotating fill
    const cities = [...anchored.slice(0, batchSize), ...rotating].slice(0, batchSize);

    const cityDisplay = cities.map(name => {
        const dist = allCities.find(c => c.name === name)?.distance || 0;
        return `${name} (${Math.round(dist)}mi)`;
    }).join(', ');

    const mode = 'HOT ZONE (ANCHORED)';
    console.log(`[Tiered Sniper] ${mode} → [${cityDisplay}] (Anchored: ${anchored.join(', ')})`);

    // ── 5. Log Scrape Run Record ───────────────────────────────────────────
    let runId: string | null = null;
    try {
        const { data: run, error } = await adminSupabase
            .from('scrape_runs')
            .insert({
                dealer_id: settings.id,
                mode,
                cities,
                status: 'Pending',
            })
            .select()
            .single();
        if (error) throw error;
        if (run) runId = run.id;

        // Update last_pulse_at - wrapped in its own try-catch to prevent trigger failure
        try {
            await adminSupabase
                .from('settings')
                .update({ last_pulse_at: now.toISOString() })
                .eq('id', settings.id);
        } catch (updateErr: any) {
            console.error('[Settings Update] Failed to update last_pulse_at:', updateErr.message);
        }
    } catch (err: any) {
        console.error('[Run Log] Failed to create scrape_run record:', err);
    }

    // ── 6. Trigger Lambda ───────────────────────────────────────────────
    // We remove the IIFE and AWAIT the trigger to ensure Vercel doesn't kill the task.
    // The Lambda handles its own status updates to 'Running' and 'Success'.
    const lambdaPayload = {
        run_id:      runId,
        mode:        'pulse',
        dealer_id:   settings.id,
        cities,
        year_min:    settings.year_min,
        year_max:    settings.year_max,
        price_min:   settings.price_min,
        price_max:   settings.price_max,
        mileage_max: settings.mileage_max,
        makes:       settings.makes || [],
        models:      settings.models || [],
        post_age_max: settings.post_age_max || 24,
        exclude_salvage: settings.exclude_salvage || false,
        posted_today: isDeepScrape ? false : true,
        max_items:   Math.min(500, settings.max_items_per_city || 25),
    };

    try {
        console.log(`[Lambda] Triggering production AI Engine for cities: [${cities.join(', ')}]`);
        const response = await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lambdaPayload),
        });

        if (!response.ok && response.status !== 504) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        if (response.status === 504) {
            console.log('[Lambda] Triggered successfully (Connection timed out, but Lambda is continuing in background).');
        } else {
            console.log('[Lambda] Scrape triggered and responded successfully.');
        }

        // Budget tracking
        try {
            const estimatedCost = 0.001;
            const { data: latest } = await adminSupabase
                .from('settings').select('budget_spent_today').eq('id', settings.id).single();
            await adminSupabase.from('settings').update({
                budget_spent_today: (latest?.budget_spent_today || 0) + estimatedCost,
            }).eq('id', settings.id);
        } catch (budgetErr: any) {
            console.error('[Budget Update] Failed to update budget:', budgetErr.message);
        }

    } catch (err: any) {
        console.error('[Lambda] Cloud trigger failed:', err.message);
        if (runId) {
            await adminSupabase.from('scrape_runs').update({
                status: 'Error',
                error_message: err.message,
                finished_at: new Date().toISOString(),
            }).eq('id', runId);
        }
    }

    return {
        success: true,
        message: `${mode} started for [${cities.join(', ')}].`,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep scrape — triggers Lambda in "deep" mode for a single listing URL
// ─────────────────────────────────────────────────────────────────────────────
export async function runDeepScrape(listingUrl: string) {
    const LAMBDA_URL = typeof process !== 'undefined' ? process.env.LAMBDA_SCRAPER_URL : null;
    if (!LAMBDA_URL) throw new Error('LAMBDA_SCRAPER_URL is not configured.');

    const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'deep', deep_url: listingUrl }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(`Deep Scrape Failed: ${error?.error || res.statusText}`);
    }

    return { success: true };
}
