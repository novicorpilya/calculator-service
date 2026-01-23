import { Resend } from 'resend';
import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'HORECA Contact Form <onboarding@resend.dev>';
// Defaults to a safe testing email if not provided in production
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'onboarding@resend.dev';

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
    // SECURITY: Enterprise-grade CORS handling
    // We must echo the specific origin when using allow-credentials: true.
    // Wildcard '*' cannot be used with credentials.
    const origin = req.headers.origin || '';
    
    // In a real enterprise scenario, you would whitelist specific domains:
    // const allowedOrigins = [process.env.VITE_APP_URL, 'https://landing.com'];
    // if (allowedOrigins.includes(origin)) { ... }
    
    // For now, we allow logical origins to ensure the form works from the landing page
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

    // Handle preflight request (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Env validation
    if (!RESEND_API_KEY) {
        console.error('[send-feedback] Server Error: Missing RESEND_API_KEY');
        return res.status(500).json({ error: 'Internal Server Error: Configuration' });
    }

    try {
        // 3. Payload validation
        const result = bodySchema.safeParse(req.body);

        if (!result.success) {
            const errorMessage = result.error.issues.map((i) => i.message).join(', ');
            return res.status(400).json({ error: `Validation Error: ${errorMessage}` });
        }

        const { name, email, message, _honey } = result.data;

        // SECURITY: Honeypot Check
        // If _honey is set, it's a bot. Return success to fool them, but do nothing.
        if (_honey) {
            console.warn(`[send-feedback] Bot detected (honeypot): ${email}`);
            return res.status(200).json({ success: true, id: 'bot-filtered' });
        }

        // SECURITY: Rate Limiting via Supabase
        const supabaseAdmin = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
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

        const resend = new Resend(RESEND_API_KEY);

        // 5. Send Email via Resend
        const data = await resend.emails.send({
            from: MAIL_FROM,
            to: [ADMIN_EMAIL],
            replyTo: email,
            subject: `🔔 Новое сообщение от ${safeName}`,
            text: `Имя: ${safeName}\nEmail: ${safeEmail}\n\nСообщение:\n${safeMessage}`,
            html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              </head>
              <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
                        <!-- Header -->
                        <tr>
                          <td style="padding: 32px 32px 0 32px; border-bottom: 1px solid #f3f4f6;">
                             <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 700; color: #111827;">Новое сообщение с сайта</h2>
                          </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                          <td style="padding: 32px;">
                            <div style="margin-bottom: 24px;">
                                <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">От кого</p>
                                <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${safeName}</p>
                                <a href="mailto:${safeEmail}" style="display: block; margin-top: 4px; font-size: 14px; color: #4f46e5; text-decoration: none;">${safeEmail}</a>
                            </div>
                            
                            <div style="margin-bottom: 0;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">Сообщение</p>
                                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${safeMessage || '<em style="color: #9ca3af;">(Без сообщения)</em>'}</div>
                            </div>
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                             <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                Это автоматическое уведомление. Ответьте на это письмо, чтобы связаться с отправителем.
                             </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
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
