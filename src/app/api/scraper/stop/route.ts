import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const dealerId = '00000000-0000-0000-0000-000000000000';

        // Find the most recent 'Pending' run for this dealer
        const { data: activeRun, error: findError } = await supabase
            .from('scrape_runs')
            .select('id')
            .eq('dealer_id', dealerId)
            .eq('status', 'Pending')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (findError) throw findError;

        if (!activeRun) {
            return Response.json({ success: true, message: 'No active scan found.' });
        }

        // Mark as Aborted
        const { error: updateError } = await supabase
            .from('scrape_runs')
            .update({
                status: 'Aborted',
                finished_at: new Date().toISOString()
            })
            .eq('id', activeRun.id);

        if (updateError) throw updateError;

        return Response.json({ success: true, message: 'Scan stopped.' });
    } catch (error: any) {
        console.error('Stop Scraper Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
