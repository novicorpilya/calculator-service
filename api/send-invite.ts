import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { type VercelRequest, type VercelResponse } from '@vercel/node';

// Runtime validation for required environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

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
            details: `Missing: ${missingVars.join(', ')}`
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

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
    const { email, role, inviteLink } = req.body || {};
    if (!email || !role || !inviteLink) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['email', 'role', 'inviteLink']
        });
    }

    try {
        const data = await resend.emails.send({
            from: 'HICS <onboarding@resend.dev>',
            to: [email],
            subject: 'Ваше приглашение в HICS',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #171717;">
            <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase;">HICS</h1>
            <p style="font-size: 16px; line-height: 1.6;">Вы приглашены как <strong>${role}</strong>.</p>
            <div style="margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #171717; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                    ПРИНЯТЬ ПРИГЛАШЕНИЕ
                </a>
            </div>
            <p style="font-size: 12px; color: #a3a3a3;">Ссылка: ${inviteLink}</p>
        </div>
      `,
        });

        return res.status(200).json(data);
    } catch (error) {
        console.error('[send-invite] Failed to send email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
