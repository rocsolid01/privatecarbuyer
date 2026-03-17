import { NextRequest } from 'next/server';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
    try {
        const { to, content } = await req.json();
        const result = await sendSMS(to, content);
        return Response.json({ success: true, result });
    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
