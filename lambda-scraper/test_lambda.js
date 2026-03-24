const url = "https://l24feaats3.execute-api.us-east-1.amazonaws.com/dev/scrape";
const payload = {
    mode: "pulse",
    cities: ["sfbay", "sacramento"],
    max_items: 6,
    year_min: 2010,
    year_max: 2026,
    price_min: 1000,
    price_max: 100000,
    mileage_max: 200000,
    dealer_id: "00000000-0000-0000-0000-000000000000"
};

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
    console.log("Scraper Result:");
    console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
    console.error("Error calling Lambda:", err);
});
