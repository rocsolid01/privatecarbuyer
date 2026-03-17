const INFERMATIC_API_URL = 'https://api.infermatic.ai/v1'; // Placeholder URL
declare var process: { env: { INFERMATIC_API_KEY?: string } };
const API_KEY = typeof process !== 'undefined' ? process.env.INFERMATIC_API_KEY : null;

export async function scoreLead(title: string, price: number, mileage: number, description: string, reconMultiplier: number = 1.0) {
    try {
        const prompt = `
      Analyze this car deal for a dealership. 
      Car: ${title}
      Price: $${price}
      Mileage: ${mileage}
      Description: ${description}
      Recon Buffer Factor: ${reconMultiplier}x

      Estimate the potential resale value (retail) and reconditioning costs.
      Apply the Recon Buffer Factor (${reconMultiplier}x) to your base repair estimate to ensure a safe margin.
      Return a JSON object with:
      - margin_estimate: numeric
      - recon_estimate: numeric
      - notes: brief summary of motivation signals (e.g., "must sell", "moving")
    `;

        const response = await fetch(`${INFERMATIC_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-7b-instruct',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            }),
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI Scoring Error:', error);
        return {
            margin_estimate: 1500,
            recon_estimate: 1000 * reconMultiplier,
            notes: 'AI scoring unavailable at the moment.',
        };
    }
}

export async function generateOutreachSMS(carTitle: string, price: number, location: string, persona: string = 'Professional car buyer', goal: string = 'Ask for bottom dollar') {
    try {
        const prompt = `
      Adopt the following Persona: ${persona}
      Generate a short, professional SMS for a car dealer contacting a private seller on Craigslist.
      Goal: ${goal}
      Context: The dealer is interested in their ${carTitle} in ${location}.
      Mention being a local buyer with cash ready.
      Keep it under 160 characters. No emojis. Include opt-out "Reply STOP".
    `;

        const response = await fetch(`${INFERMATIC_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-7b-instruct',
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI SMS Gen Error:', error);
        return `Hi, I saw your ${carTitle}. Local dealer, cash ready. I'm interested in a quick buy. Reply STOP to opt out.`;
    }
}
export async function generateOutreachTelegram(carTitle: string, price: number, location: string) {
    try {
        const prompt = `
      Generate a short, catchy, and friendly Telegram message for a car dealer contacting a private seller from Craigslist.
      The dealer is interested in their ${carTitle} in ${location}.
      Goal: Mention being a local buyer with cash, ask if it's still available, and suggest a quick meeting if possible.
      Include a "🚗" emoji.
    `;

        const response = await fetch(`${INFERMATIC_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-7b-instruct',
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Telegram Gen Error:', error);
        return `Hi! 🚗 Saw your ${carTitle} on Craigslist. I'm a local dealer interested in a cash buy today. Still available?`;
    }
}
