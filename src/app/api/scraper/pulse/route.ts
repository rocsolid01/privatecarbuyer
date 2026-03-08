import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/apify';

/**
 * Autonomous Pulse Endpoint
 * Designed to be called by a Cron job (Vercel Cron, GitHub Actions, etc.)
 */
export async function GET(req: NextRequest) {
    try {
        // Fetch all dealers with auto-scan enabled
        const { data: dealers, error: fetchError } = await supabase
            .from('settings')
            .select('*')
            .eq('auto_scan_enabled', true);

        if (fetchError) throw fetchError;
        if (!dealers || dealers.length === 0) {
            return Response.json({ success: true, message: 'No dealers with autonomous mode active.' });
        }

        const currentHour = new Date().getHours();
        const results = [];

        for (const settings of dealers) {
            const dealerId = settings.id;

            // 1. Dynamic Active Window (Active settings)
            const activeStart = settings.active_hour_start ?? 7;
            const activeEnd = settings.active_hour_end ?? 22;

            if (currentHour >= activeEnd || currentHour < activeStart) {
                console.log(`[Pulse] ${dealerId}: Sleeping hours active (${activeEnd}-${activeStart}). Skipping.`);
                results.push({ dealerId, status: 'sleeping' });
                continue;
            }

            // 2. Negative Frequency Scaling (Back-off)
            const lastScan = settings.last_scan_at ? new Date(settings.last_scan_at) : new Date(0);
            const minsSinceScan = (new Date().getTime() - lastScan.getTime()) / (1000 * 60);

            const baseWait = settings.pulse_interval ?? 15;
            const backoff = Math.min(settings.consecutive_empty_runs * 10, 60); // Max 1hr backoff
            const requiredWait = baseWait + backoff;

            if (minsSinceScan < requiredWait) {
                console.log(`[Pulse] ${dealerId}: Backoff active (${Math.round(minsSinceScan)}/${requiredWait}m). Skipping.`);
                results.push({ dealerId, status: 'backoff', wait: Math.round(requiredWait - minsSinceScan) });
                continue;
            }

            // 3. Trigger Scraper
            console.log(`[Pulse] ${dealerId}: Triggering autonomous scan.`);
            const scraperResult = await runScraper(settings);

            if (scraperResult.success) {
                // Update last_scan_at to track timing
                await supabase
                    .from('settings')
                    .update({ last_scan_at: new Date().toISOString() })
                    .eq('id', dealerId);

                results.push({ dealerId, status: 'triggered' });
            } else {
                results.push({ dealerId, status: 'cooldown', wait: scraperResult.wait });
            }
        }

        return Response.json({ success: true, pulseResults: results });
    } catch (error: any) {
        console.error('Autonomous Pulse Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
