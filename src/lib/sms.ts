const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

export async function sendSMS(to: string, content: string) {
    if (!TELNYX_API_KEY) throw new Error('TELNYX_API_KEY is not configured');

    const response = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TELNYX_API_KEY}`
        },
        body: JSON.stringify({
            to: to,
            from: process.env.TELNYX_PHONE_NUMBER,
            text: content
        })
    });

    if (!response.ok) throw new Error('Telnyx error');
    const data = await response.json();
    return { success: true, messageId: data.data.id };
}
