import { Resend } from 'resend';
import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';


// Robust env var access
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'HORECA Contact Form <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'onboarding@resend.dev';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validation Schema matches frontend requirements
const bodySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    message: z.string().optional().default(''),
    _honey: z.string().optional(), // Honeypot field
});

// Basic HTML sanitization to prevent injection
const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ... (CORS code remains same) ...
    // SECURITY: Enterprise-grade CORS handling
    const origin = req.headers.origin || '';
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Env validation
    if (!RESEND_API_KEY) {
        console.error('[send-feedback] Server Error: Missing RESEND_API_KEY');
        return res.status(500).json({ error: 'Configuration Error: Missing Email Key' });
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[send-feedback] Server Error: Missing Supabase Config');
         return res.status(500).json({ error: 'Configuration Error: Missing Database Config' });
    }

    try {
        const result = bodySchema.safeParse(req.body);

        if (!result.success) {
            const errorMessage = result.error.issues.map((i) => i.message).join(', ');
            return res.status(400).json({ error: `Validation Error: ${errorMessage}` });
        }

        const { name, email, message, _honey } = result.data;

        if (_honey) {
            console.warn(`[send-feedback] Bot detected (honeypot): ${email}`);
            return res.status(200).json({ success: true, id: 'bot-filtered' });
        }

        // SECURITY: Rate Limiting via Supabase
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const ip =
            (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

        // Check last submission from this IP
        const { data: recentLogs } = await supabaseAdmin
            .from('feedback_logs')
            .select('created_at')
            .eq('ip_address', ip)
            .order('created_at', { ascending: false })
            .limit(1);

        if (recentLogs && recentLogs.length > 0) {
            const lastTime = new Date(recentLogs[0].created_at).getTime();
            const now = Date.now();
            const COOLDOWN_MS = 60 * 1000; // 1 minute per IP

            if (now - lastTime < COOLDOWN_MS) {
                console.warn(`[send-feedback] Rate limit hit for IP: ${ip}`);
                return res
                    .status(429)
                    .json({ error: 'Too many requests. Please try again in a minute.' });
            }
        }

        // 4. Sanitize inputs for HTML email
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message);
        const formattedMessage = safeMessage.replace(/\n/g, '<br/>');

        const resend = new Resend(RESEND_API_KEY);

        // 5. Send Email via Resend
        const data = await resend.emails.send({
            from: MAIL_FROM,
            to: [ADMIN_EMAIL],
            replyTo: email, // Use raw email for reply-to as it expects a valid email format
            subject: `🔔 Новое сообщение от ${safeName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                    <h2 style="border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Новое обращение с сайта</h2>
                    
                    <div style="margin: 20px 0; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0;"><strong>Имя:</strong> ${safeName}</p>
                        <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #0070f3;">${safeEmail}</a></p>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="font-size: 16px; color: #666;">Сообщение:</h3>
                        <div style="padding: 15px; border-left: 4px solid #0070f3; background-color: #f0f7ff; border-radius: 4px; line-height: 1.6;">
                            ${formattedMessage || '<em>(Без сообщения)</em>'}
                        </div>
                    </div>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 10px;">
                        Это письмо отправлено автоматически с формы обратной связи.
                    </p>
                </div>
            `,
        });

        if (data.error) {
            console.error('[send-feedback] Resend API Warning:', data.error);
            // Return 400 or 500 depending on error type, but usually 400 for bad requests to external service
            return res.status(400).json({ error: 'Failed to send email. Please try again later.' });
        }

        // Log success to audit trail
        await supabaseAdmin.from('feedback_logs').insert({
            ip_address: ip,
            email: email,
            user_agent: req.headers['user-agent'],
        });

        return res.status(200).json({ success: true, id: data.data?.id });
    } catch (error) {
        console.error('[send-feedback] Critical Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
