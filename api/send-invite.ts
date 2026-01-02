import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Создаем серверный клиент Supabase для проверки токена
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Нужен Service Role ключ для надежной проверки
);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // SECURITY: Проверяем авторизацию
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });

    // Проверяем токен через Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // Проверяем, что пользователь — админ
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin only' });
    }

    const { email, role, inviteLink } = req.body;

    try {
        const data = await resend.emails.send({
            from: 'HORECA Calculator <onboarding@resend.dev>',
            to: [email],
            subject: 'Ваше приглашение в HORECA Calculator',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #171717;">
            <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase;">HORECA Calculator</h1>
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
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
