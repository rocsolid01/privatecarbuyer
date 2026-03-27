import { NextRequest } from 'next/server';

/**
 * GET /api/scraper/check
 * 
 * Lightweight heartbeat to verify if the Lambda Scraper URL is configured
 * and responding. This helps the Control Center show a real status.
 */
export async function GET(req: NextRequest) {
    try {
        const LAMBDA_URL = process.env.LAMBDA_SCRAPER_URL;
        
        if (!LAMBDA_URL) {
            console.error('[Check] LAMBDA_SCRAPER_URL not set');
            return Response.json({ success: false, error: 'LAMBDA_SCRAPER_URL not set' }, { status: 404 });
        }

        console.log('[Check] Pinging Lambda at:', LAMBDA_URL);

        // We do a minimal ping (OPTIONS or a HEAD request) to the Lambda URL
        // to see if it's reachable without triggering a full scrape.
        const res = await fetch(LAMBDA_URL, { 
            method: 'OPTIONS',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('[Check] Lambda responded with status:', res.status);

        // Broaden the success criteria: any response from the endpoint 
        // means it is reachable and 'Online'.
        if (res.status < 500) { 
            return Response.json({ success: true, status: 'Online' });
        }

        return Response.json({ success: false, status: 'Offline', details: `Status ${res.status}` }, { status: 503 });
    } catch (e: any) {
        console.error('[Check] Heartbeat failed:', e.message);
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
