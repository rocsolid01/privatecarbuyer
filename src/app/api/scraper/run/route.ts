import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/scraper';

export async function POST(req: NextRequest) {
    try {
        // Find the most recently updated settings record (fallback for dev)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (settingsError) throw settingsError;
        if (!settings) return Response.json({ success: false, error: 'No settings found. Please configure your search in Settings.' }, { status: 404 });

        const { force } = await req.json().catch(() => ({ force: false }));
        const result = await runScraper(settings, false, force);

        if (!result.success && (result.reason === 'cooldown' || result.reason === 'sleeping')) {
            return Response.json({
                success: false,
                error: `System in ${result.reason} mode. Next run available in ${result.wait} minutes.`,
                wait: result.wait
            }, { status: 429 });
        }

        return Response.json({ success: true, result });
    } catch (e: any) {
        console.error('[Scraper API Error]:', e);
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
