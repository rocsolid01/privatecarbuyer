declare var process: { env: { TELNYX_API_KEY?: string } };
const TELNYX_API_KEY = typeof process !== 'undefined' ? process.env.TELNYX_API_KEY : null;

export async function sendSMS(to: string, message: string) {
    try {
        // Note: In real usage, you'd use the 'telnyx' package, but we'll use fetch
        // for resilience given current environment constraints.
        const response = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TELNYX_API_KEY}`,
            },
            body: JSON.stringify({
                from: '+1234567890', // In production, rotate available numbers from settings
                to: to,
                text: message,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.errors?.[0]?.detail || 'Failed to send SMS');

        return { success: true, messageId: data.data.id };
    } catch (error: any) {
        console.error('Telnyx SMS Error:', error);
        return { success: false, error: error.message };
    }
}
