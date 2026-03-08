const mockLead = {
    id: "mock_" + Date.now(),
    title: "2021 Toyota Camry SE - Sniper Test",
    price: 12500,
    url: "https://losangeles.craigslist.org/ant/cto/d/mock.html",
    posted_at: new Date().toISOString(),
    location: "Los Angeles",
    description: "Perfect car for a private buyer. One owner, low miles, mint condition. Moving sale. VIN: TESTIN123456789",
    sellerPhone: "+17143329798",
    attributes: [
        { label: "odometer", value: "35000" },
        { label: "vin", value: "TESTVIN123456789" }
    ]
};

async function test() {
    console.log('Sending mock lead to local webhook...');
    const response = await fetch('http://localhost:3000/api/webhooks/apify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([mockLead])
    });

    const result = await response.json();
    console.log('Webhook Result:', result);
}

test();
