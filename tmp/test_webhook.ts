
async function sendMockWebhook() {
    const payload = [
        {
            title: "2015 Honda Civic - 80k miles",
            price: "$12,500",
            location: "Los Angeles, CA",
            url: "https://losangeles.craigslist.org/cto/d/civic-80k/123.html",
            attributes: {}, // Mocking empty attributes to test fallback
            description: "Owner selling my civic with only 80k miles on it. Very clean car."
        },
        {
            title: "2012 Toyota Camry LE",
            price: "$9,000",
            location: "Phoenix, AZ",
            url: "https://phoenix.craigslist.org/cto/d/camry-clean/456.html",
            attributes: {}, 
            description: "Runs great, no issues. Title is clean."
        },
        {
            title: "2018 Ford F150 Raptor - 45k mi",
            price: "$45,000",
            location: "San Diego, CA",
            url: "https://sd.craigslist.org/cto/d/raptor-45k/789.html",
            attributes: { "odometer": "45,000" }, // Test when it DOES have attributes
            description: "Selling my raptor. 45k miles."
        }
    ];

    try {
        const res = await fetch('http://localhost:3000/api/webhooks/apify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Webhook Response:', data);
    } catch (err) {
        console.error('Webhook Failed:', err);
    }
}

sendMockWebhook();
