import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Redis } from '@upstash/redis';
import { generateCatInquiryTemplate } from '@/Utils/email-template';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const { firstName, lastName, email, message } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';

    // Rate limiting (5 submissions per IP per hour)
    const rateLimitKey = `rate-limit:${ip}`;
    const requests = await redis.incr(rateLimitKey);

    if (requests === 1) {
        await redis.expire(rateLimitKey, 3600); // Reset count after 1 hour
    }

    if (requests > 5) {
        return NextResponse.json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    try {
        const data = await resend.emails.send({
            from: 'RCC Website <test@resend.dev>',
            to: process.env.OWNER_EMAIL!,
            subject: '🐱 New Cat Inquiry from RCC Website',
            html: generateCatInquiryTemplate({ firstName, lastName, email, message }),
        });

        return NextResponse.json({ message: 'Email sent successfully!', data });
    } catch (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ message: 'Failed to send email', error }, { status: 500 });
    }
}
