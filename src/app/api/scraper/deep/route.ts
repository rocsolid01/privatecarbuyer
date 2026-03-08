import { NextRequest, NextResponse } from 'next/server';
import { runDeepScrape } from '@/lib/apify';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return Response.json({ success: false, error: 'Listing URL is required' }, { status: 400 });
        }

        const result = await runDeepScrape(url);

        return Response.json({ success: true, message: 'Deep extraction started' });
    } catch (error: any) {
        console.error('Deep Scrape Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
