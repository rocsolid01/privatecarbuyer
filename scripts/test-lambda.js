const LAMBDA_URL = 'https://l24feaats3.execute-api.us-east-1.amazonaws.com/dev/scrape';

const payload = {
    mode: 'deep',
    deep_url: 'https://losangeles.craigslist.org/lac/cto/d/woodland-hills-2019-toyota-prius-prime/7921000203.html',
    dealer_id: '00000000-0000-0000-0000-000000000000'
};

async function test() {
    try {
        console.log('Testing Lambda (DEEP) at:', LAMBDA_URL);
        const res = await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
