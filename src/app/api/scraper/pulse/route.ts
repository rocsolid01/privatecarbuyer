import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/scraper';

/**
 * GET /api/scraper/pulse
 *
 * Called by cron-job.org every 30 minutes.
 * Fires the scraper unconditionally for all settings records.
 * No internal scheduling logic — cron-job.org owns the clock.
 */
export async function GET(req: NextRequest) {
    try {
        const { data: allSettings } = await supabase.from('settings').select('*');
        if (!allSettings || allSettings.length === 0) {
            return Response.json({ success: true, message: 'No settings records found.' });
        }

        let sessions = 0;
        for (const s of allSettings) {
            await runScraper(s, false, true);
            sessions++;
        }

        return Response.json({ success: true, sessions });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
