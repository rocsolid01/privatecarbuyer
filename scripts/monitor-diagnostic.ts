import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOG_FILE = join(process.cwd(), 'diagnostic_log.txt');

async function monitor() {
    console.log('[Diagnostic] Starting 1-Hour Monitoring...');
    fs.writeFileSync(LOG_FILE, `Diagnostic Run Started at ${new Date().toISOString()}\n`);

    for (let i = 0; i < 60; i++) { // 60 minutes
        try {
            // 1. Trigger Pulse
            await fetch('http://localhost:3000/api/scraper/pulse');
            
            // 2. Read Stats
            const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
            const { data: latestRun } = await supabase.from('scrape_runs').select('*').order('created_at', { ascending: false }).limit(1).single();
            const { data: activities } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(3);

            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] Leads: ${leadsCount} | Last Run: ${latestRun?.status} | Activity: ${activities?.[0]?.message}\n`;
            
            console.log(logEntry);
            fs.appendFileSync(LOG_FILE, logEntry);

        } catch (e: any) {
            fs.appendFileSync(LOG_FILE, `[Error] ${e.message}\n`);
        }
        
        // Wait 1 minute
        await new Promise(r => setTimeout(r, 60000));
    }
}

monitor();
