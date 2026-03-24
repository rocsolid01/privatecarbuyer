
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
    const id = '99dfcde0-db2c-8b6a-4b97-953b-74f3ddb08de3';
    const now = new Date().toISOString();
    
    console.log(`Attempting to update settings ${id} with last_pulse_at = ${now}`);
    
    const { data, error, status, statusText } = await supabase
        .from('settings')
        .update({ last_pulse_at: now })
        .eq('id', id)
        .select();
        
    if (error) {
        console.error('Update Failed!');
        console.error('Status:', status, statusText);
        console.error('Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Update Successful!');
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

testUpdate();
