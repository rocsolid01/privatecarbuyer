import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        await supabase.from('scrape_runs').update({ status: 'Aborted', finished_at: new Date().toISOString() }).eq('status', 'Pending');
        return Response.json({ success: true });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
