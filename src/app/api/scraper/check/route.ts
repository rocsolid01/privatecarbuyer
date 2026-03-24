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
            return Response.json({ success: false, error: 'LAMBDA_SCRAPER_URL not set' }, { status: 404 });
        }

        // We do a minimal ping (OPTIONS or a HEAD request) to the Lambda URL
        // to see if it's reachable without triggering a full scrape.
        const res = await fetch(LAMBDA_URL, { 
            method: 'OPTIONS',
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok || res.status === 405) { // 405 Method Not Allowed is fine, it means the URL exists
            return Response.json({ success: true, status: 'Online' });
        }

        return Response.json({ success: false, status: 'Offline' }, { status: 503 });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
