import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });
export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;
    try {
        const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            await supabase.from('profiles').update({ status: 'Active' }).eq('email', session.customer_email);
        }
        return Response.json({ received: true });
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 400 });
    }
}
