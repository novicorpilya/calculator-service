import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/core/logging';
import type { ActionResult } from '@/core/types/results';

export interface EmailResponse {
    success: boolean;
    mode?: 'production' | 'development-mock';
}

export interface IEmailService {
    sendInvitation(
        email: string,
        role: string,
        inviteLink: string
    ): Promise<ActionResult<EmailResponse>>;
}

export class EmailService implements IEmailService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async sendInvitation(
        email: string,
        role: string,
        inviteLink: string
    ): Promise<ActionResult<EmailResponse>> {
        try {
            const {
                data: { session },
            } = await this.supabase.auth.getSession();

            const response = await fetch('/api/send-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ email, role, inviteLink }),
            });

            if (response.ok) {
                return { success: true, data: { success: true, mode: 'production' } };
            }

            // Local development handling
            if (
                !response.ok &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1')
            ) {
                this.logDevEmail(email, role, inviteLink);
                return { success: true, data: { success: true, mode: 'development-mock' } };
            }

            const errorData = await response.json();
            return {
                success: false,
                error: { message: errorData.error || 'Failed to send email' },
            };
        } catch (error: unknown) {
            // Handle network errors in local dev
            if (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
            ) {
                this.logDevEmail(email, role, inviteLink);
                return { success: true, data: { success: true, mode: 'development-mock' } };
            }

            logger.error('[Email Service Error]', { error });
            return { success: false, error: this.wrapError(error) };
        }
    }

    private logDevEmail(email: string, role: string, inviteLink: string) {
        logger.info('📧 [DEV MODE] ПИСЬМО БЫЛО БЫ ОТПРАВЛЕНО', { email, role, inviteLink });

        toast.info('Режим разработки: Письмо в консоли', {
            description:
                'На localhost реальные письма не уходят. Скопируйте ссылку из консоли (F12) или по кнопке ниже.',
            duration: 15000,
            action: {
                label: 'Копировать ссылку',
                onClick: () => {
                    navigator.clipboard.writeText(inviteLink);
                    toast.success('Ссылка скопирована!');
                },
            },
        });
    }
}
