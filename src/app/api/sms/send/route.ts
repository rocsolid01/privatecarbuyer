import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint to send SMS via Telnyx and log it to the database.
 * Expects { leadId: string, content: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { leadId, content } = await req.json();

        if (!leadId || !content) {
            return NextResponse.json({ error: 'Missing leadId or content' }, { status: 400 });
        }

        // 1. Fetch lead and dealer settings
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (leadError || !lead) throw new Error('Lead not found');
        if (settingsError || !settings) throw new Error('Settings not found');

        const dealerPhone = settings.sms_numbers?.[0];
        const sellerPhone = lead.phone;

        if (!dealerPhone || !sellerPhone) {
            throw new Error('Missing phone numbers for outreach');
        }

        // 2. Trigger Telnyx (Mocking for now, will use src/lib/sms.ts)
        // Note: We'll update src/lib/sms.ts to be more robust
        const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

        const telnyxRes = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TELNYX_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: dealerPhone,
                to: sellerPhone,
                text: content
            })
        });

        const telnyxData = await telnyxRes.json();

        if (!telnyxRes.ok) {
            throw new Error(`Telnyx Error: ${telnyxData.errors?.[0]?.detail || 'Unknown error'}`);
        }

        // 3. Log to Database
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                lead_id: leadId,
                sender_type: 'dealer',
                content: content,
                status: 'sent',
                external_message_id: telnyxData.data?.id
            })
            .select()
            .single();

        if (messageError) throw messageError;

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error('Send SMS Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
