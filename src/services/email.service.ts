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

    sendFeedback(data: {
        name: string;
        email: string;
        message: string;
    }): Promise<ActionResult<EmailResponse>>;
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
        // Local development: Skip real fetch to avoid console 404s if Vercel dev is not running
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.logDevEmail(email, role, inviteLink);
            return { success: true, data: { success: true, mode: 'development-mock' } };
        }

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

            const errorData = await response.json();
            return {
                success: false,
                error: { message: errorData.error || 'Failed to send email' },
            };
        } catch (error: unknown) {
            logger.error('[Email Service Error]', { error });
            return { success: false, error: this.wrapError(error) };
        }
    }

    private logDevEmail(email: string, role: string, inviteLink: string) {
        logger.info('📧 [DEV MODE] ПИСЬМО БЫЛО БЫ ОТПРАВЛЕНО', { email, role, inviteLink });
    }

    async sendFeedback(data: {
        name: string;
        email: string;
        message: string;
    }): Promise<ActionResult<EmailResponse>> {
        // Local development: Skip real fetch to avoid console 404s
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            logger.info('📧 [DEV MODE] ОБРАТНАЯ СВЯЗЬ (Mock)', data);
            await new Promise((resolve) => setTimeout(resolve, 800));
            return { success: true, data: { success: true, mode: 'development-mock' } };
        }

        try {
            const response = await fetch('/api/send-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                return { success: true, data: { success: true, mode: 'production' } };
            }

            const errorData = await response.json();
            return {
                success: false,
                error: { message: errorData.error || 'Failed to send feedback' },
            };
        } catch (error: unknown) {
            logger.error('[Email Service Error - Feedback]', { error });
            return { success: false, error: this.wrapError(error) };
        }
    }
}
