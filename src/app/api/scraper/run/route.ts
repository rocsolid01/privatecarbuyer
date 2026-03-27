import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/scraper';

/**
 * POST /api/scraper/run
 *
 * Manual "Force Scan" trigger from the Control Center UI.
 * Scheduling is owned by cron-job.org (every 30 min) — this is just a
 * one-off override for immediate testing or manual runs.
 */
export async function POST(req: NextRequest) {
    try {
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (settingsError) throw settingsError;
        if (!settings) {
            return Response.json(
                { success: false, error: 'No settings found. Please configure your search in Settings.' },
                { status: 404 }
            );
        }

        const result = await runScraper(settings, false, false);
        return Response.json({ success: true, result });
    } catch (e: any) {
        console.error('[Scraper API Error]:', e);
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
