import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkRecentLeads() {
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (lError) {
        console.error('Error fetching leads:', lError.message);
    } else {
        console.log('Recent Leads (Scrape Time Verification):');
        leads.forEach(l => console.log(`- ${l.title} (Scraped at: ${new Date(l.created_at).toLocaleString()})`));
    }

    const { data: settings, error: sError } = await supabase
        .from('settings')
        .select('budget_spent_today, daily_budget_usd')
        .single();

    if (sError) {
        console.error('Error fetching settings:', sError.message);
    } else {
        console.log('\nBudget Status:');
        console.log(`- Spent Today: $${settings.budget_spent_today}`);
        console.log(`- Daily Budget: $${settings.daily_budget_usd}`);
    }
}

checkRecentLeads();
