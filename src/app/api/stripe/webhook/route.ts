import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerEmail = session.customer_email;
            const subscriptionId = session.subscription as string;

            // Update profile in Supabase to mark as subscribed
            // Note: We'd typically match by customerEmail or a custom client_reference_id
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_id: subscriptionId, status: 'Active' })
                .eq('email', customerEmail);

            if (error) throw error;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
