import { NextRequest } from 'next/server';
import { runDeepScrape } from '@/lib/scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        const result = await runDeepScrape(url);
        return Response.json({ success: true, result });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
