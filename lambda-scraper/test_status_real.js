const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mwfnufsmptzzukcotndh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LAMBDA_URL = "https://l24feaats3.execute-api.us-east-1.amazonaws.com/dev/scrape";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
    console.log("Creating mock scrape_run...");
    const { data: run, error } = await supabase
        .from('scrape_runs')
        .insert({
            dealer_id: '00000000-0000-0000-0000-000000000000',
            mode: 'pulse',
            cities: ['sd'],
            status: 'Pending'
        })
        .select()
        .single();
    
    if (error) {
        console.error("Failed to create run:", error);
        return;
    }

    const run_id = run.id;
    console.log(`Mock run created: ${run_id}. Triggering Lambda...`);

    const payload = {
        run_id,
        mode: "pulse",
        cities: ["sd"],
        max_items: 2,
        year_min: 2010,
        year_max: 2026,
        price_min: 1000,
        price_max: 100000,
        mileage_max: 200000,
        dealer_id: "00000000-0000-0000-0000-000000000000"
    };

    const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    console.log("Lambda trigger status:", res.status);
    
    // Poll for status update in DB
    console.log("Polling database for status updates (Success expected within 60s)...");
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const { data: updated } = await supabase.from('scrape_runs').select('status, leads_found').eq('id', run_id).single();
        console.log(`Iteration ${i+1}: Status = ${updated.status}, Leads = ${updated.leads_found}`);
        if (updated.status === 'Success') {
            console.log("Verification Successful: Status transitioned to Success.");
            break;
        }
    }
}

runTest();
