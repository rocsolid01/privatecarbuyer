import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook handler for Telnyx inbound messages and status updates.
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const eventType = payload.data?.event_type;
        const msgData = payload.data?.payload;

        if (!eventType || !msgData) {
            return Response.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Handle Inbound Message
        if (eventType === 'message.received') {
            const from = msgData.from.phone_number;
            const content = msgData.text;

            // Find lead by phone number
            const { data: lead, error: leadError } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', from)
                .single();

            if (lead) {
                await supabase.from('messages').insert({
                    lead_id: lead.id,
                    sender_type: 'seller',
                    content: content,
                    status: 'received',
                    external_message_id: msgData.id
                });
            }
        }

        // 2. Handle Status Updates (Delivered, Failed)
        if (eventType === 'message.finalized') {
            const externalId = msgData.id;
            const status = msgData.status;

            await supabase
                .from('messages')
                .update({
                    status: status === 'delivered' ? 'delivered' : 'failed',
                    error_message: status === 'failed' ? 'Delivery failed' : null
                })
                .eq('external_message_id', externalId);
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Telnyx Webhook Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
