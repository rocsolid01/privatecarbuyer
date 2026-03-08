const mockLead = {
    id: "test_" + Date.now(),
    title: "Test Car",
    price: 5000,
    url: "http://example.com/test",
    posted_at: new Date().toISOString()
};

async function test() {
    console.log('Testing webhook...');
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/apify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([mockLead])
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
