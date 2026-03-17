import { NextRequest } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });
export async function POST(req: NextRequest) {
    try {
        const { priceId, customerEmail } = await req.json();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
            cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/pricing',
            customer_email: customerEmail,
        });
        return Response.json({ id: session.id });
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
