import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/scraper';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        const { data: dealers } = await supabase.from('settings').select('*').eq('auto_scan_enabled', true);
        if (!dealers) return Response.json({ success: true, message: 'None' });
        for (const s of dealers) {
            await runScraper(s, false, force);
        }
        return Response.json({ success: true });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
