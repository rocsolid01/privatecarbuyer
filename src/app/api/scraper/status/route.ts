import { NextRequest } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

/**
 * GET /api/scraper/status
 * Returns recent scrape runs and total lead count for diagnostics.
 */
export async function GET(req: NextRequest) {
    try {
        const [runsResult, leadsResult] = await Promise.all([
            adminSupabase
                .from('scrape_runs')
                .select('id, status, cities, mode, created_at, finished_at, error_message')
                .order('created_at', { ascending: false })
                .limit(5),
            adminSupabase
                .from('leads')
                .select('id, title, price, city, created_at', { count: 'exact' })
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        return Response.json({
            success: true,
            total_leads: leadsResult.count,
            recent_leads: leadsResult.data,
            recent_runs: runsResult.data,
        });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
