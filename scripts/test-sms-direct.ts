import { sendSMS } from '../src/lib/sms';

async function testDirectSMS() {
    console.log('--- Direct SMS Testing ---');
    const targetNumber = '+17143329798';
    const testMessage = 'Hello! This is a test from the Private Car Buyer "Sniper" engine. Direct connectivity test.';

    console.log(`Attempting to send message to: ${targetNumber}`);

    try {
        const result = await sendSMS(targetNumber, testMessage);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('SUCCESS: Message sent to Telnyx queue.');
        } else {
            console.error('FAILED: Telnyx rejected the request. Check your API key and balance.');
        }
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
}

testDirectSMS();
