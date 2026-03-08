import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runScraper } from '@/lib/apify';

export async function POST(req: NextRequest) {
    try {
        const dealerId = '00000000-0000-0000-0000-000000000000';

        // Fetch settings (try hardcoded ID first, fallback to first available record)
        let { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .eq('id', dealerId)
            .maybeSingle();

        if (!settings && !settingsError) {
            // Fallback: Just get the first settings record
            const { data: firstSettings } = await supabase
                .from('settings')
                .select('*')
                .limit(1)
                .maybeSingle();
            settings = firstSettings as any;
        }

        if (settingsError || !settings) {
            return Response.json({
                success: false,
                error: 'Dealer settings not found. Please go to the Settings page and click "Save Config" once to initialize your scraper.'
            }, { status: 404 });
        }

        const result = await runScraper(settings);

        if (result.success) {
            // Update settings' timing and reset empty runs on manual trigger success
            await supabase
                .from('settings')
                .update({
                    updated_at: new Date().toISOString(),
                    last_scan_at: new Date().toISOString(),
                    consecutive_empty_runs: 0 // Reset since user manual trigger counts as activity
                })
                .eq('id', settings.id);

            return Response.json({ success: true, data: result.data });
        } else {
            return Response.json({
                success: false,
                error: `Cooldown active. Wait ${result.wait} mins.`,
                wait: result.wait
            }, { status: 429 });
        }
    } catch (error: any) {
        console.error('Scraper Trigger Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
