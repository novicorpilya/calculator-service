import { Resend } from 'resend';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { type VercelRequest, type VercelResponse } from '@vercel/node';

// Runtime validation for required environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'HICS <onboarding@resend.dev>';

// Simple interface instead of union type to simplify checks
interface EnvValidationResult {
    valid: boolean;
    missing?: string[];
}

function validateEnv(): EnvValidationResult {
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!RESEND_API_KEY) missing.push('RESEND_API_KEY');

    if (missing.length > 0) {
        return { valid: false, missing };
    }
    return { valid: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Validate environment configuration
    const envCheck = validateEnv();
    if (!envCheck.valid) {
        // Safe access with fallback, satisfying TS strictly
        const missingVars = envCheck.missing || [];
        console.error('[send-invite] Missing env variables:', missingVars);
        return res.status(500).json({
            error: 'Server misconfiguration',
            details: `Missing: ${missingVars.join(', ')}`,
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // SECURITY: Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing auth header' });
    }

    // Initialize clients after env validation
    const supabaseAdmin = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string);
    const resend = new Resend(RESEND_API_KEY as string);

    // Verify token via Supabase
    const token = authHeader.replace('Bearer ', '');
    const {
        data: { user },
        error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin only' });
    }

    // Validate request body
    // Validate request body
    const InviteSchema = z.object({
        email: z.string().email(),
        role: z.string().min(1),
        inviteLink: z.string().url(),
    });

    const validation = InviteSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.error.issues,
        });
    }

    const { email, inviteLink } = validation.data;

    try {
        const data = await resend.emails.send({
            from: MAIL_FROM,
            to: [email],
            subject: 'Приглашение к настройке HICS',
            text: `Вас пригласили настроить аккаунт HICS. Перейдите по ссылке: ${inviteLink}`,
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
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
                        <!-- Header -->
                        <tr>
                          <td style="padding: 32px 32px 0 32px; text-align: center;">
                             <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.025em;">HICS</h1>
                          </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                          <td style="padding: 24px 32px 32px 32px; text-align: center;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                              Администратор пригласил вас настроить аккаунт. Доступ уже открыт.
                            </p>
                            <a href="${inviteLink}" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; transition: opacity 0.2s;">
                              Настроить аккаунт
                            </a>
                            <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                              Если кнопка не работает, откройте ссылку в браузере:<br/>
                              <a href="${inviteLink}" style="color: #6b7280; text-decoration: underline; word-break: break-all;">${inviteLink}</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
                        © ${new Date().getFullYear()} HICS Inc. Все права защищены.
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            `,
        });

        return res.status(200).json(data);
    } catch (error) {
        console.error('[send-invite] Failed to send email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
