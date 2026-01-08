import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EmailResponse {
    success: boolean;
    mode?: 'production' | 'development-mock';
}

export interface IEmailService {
    sendInvitation(email: string, role: string, inviteLink: string): Promise<EmailResponse>;
}

export class EmailService implements IEmailService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async sendInvitation(email: string, role: string, inviteLink: string): Promise<EmailResponse> {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();

            const response = await fetch('/api/send-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ email, role, inviteLink }),
            });

            if (response.ok) {
                return { success: true, mode: 'production' };
            }

            if (!response.ok && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                throw new Error('API_NOT_FOUND_LOCAL');
            }

            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');

        } catch (error: unknown) {
            const errMessage = error instanceof Error ? error.message : String(error);
            if (errMessage === 'API_NOT_FOUND_LOCAL' || (error instanceof TypeError)) {
                this.logDevEmail(email, role, inviteLink);
                return { success: true, mode: 'development-mock' };
            }

            console.error('[Email Service Error]', error);
            throw error;
        }
    }

    private logDevEmail(email: string, role: string, inviteLink: string) {
        console.log('%c------------------------------------------', 'color: #3b82f6; font-weight: bold;');
        console.log('%c📧 [DEV MODE] ПИСЬМО БЫЛО БЫ ОТПРАВЛЕНО:', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
        console.log(`Кому: ${email}`);
        console.log(`Роль: ${role}`);
        console.log(`Ссылка: ${inviteLink}`);
        console.log('%c------------------------------------------', 'color: #3b82f6; font-weight: bold;');

        toast.info('Режим разработки: Письмо в консоли', {
            description: 'На localhost реальные письма не уходят. Скопируйте ссылку из консоли (F12) или по кнопке ниже.',
            duration: 15000,
            action: {
                label: 'Копировать ссылку',
                onClick: () => {
                    navigator.clipboard.writeText(inviteLink);
                    toast.success('Ссылка скопирована!');
                }
            }
        });
    }
}
