
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewLeads() {
    console.log('Checking for new leads inserted in the last 10 minutes...');
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('leads')
        .select('title, city, price, created_at')
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No new leads found.');
        return;
    }

    console.log(`Found ${data.length} new leads!`);
    console.table(data.map(l => ({
        title: l.title.slice(0, 40),
        city: l.city,
        price: l.price,
        created_at: new Date(l.created_at).toLocaleString()
    })));
}

checkNewLeads();
