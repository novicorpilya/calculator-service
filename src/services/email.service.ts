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

    async sendFeedback(data: { name: string; email: string; message: string }): Promise<ActionResult<EmailResponse>> {
        try {
            // In a real scenario, this would call an API endpoint like '/api/send-feedback'
            // For now, we simulate the logic similar to sendInvitation but without auth requirement for landing page

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

            // Local development handling or fallback
            if (
                !response.ok &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1')
            ) {
                logger.info('📧 [DEV MODE] ОБРАТНАЯ СВЯЗЬ', data);
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 1000));
                
                toast.info('Режим разработки: Сообщение "отправлено" в консоль', {
                    description: `От: ${data.name} (${data.email})`,
                });
                return { success: true, data: { success: true, mode: 'development-mock' } };
            }

             const errorData = await response.json();
            return {
                success: false,
                error: { message: errorData.error || 'Failed to send feedback' },
            };

        } catch (error: unknown) {
             // Handle network errors in local dev
            if (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
            ) {
                logger.info('📧 [DEV MODE] ОБРАТНАЯ СВЯЗЬ (Catch)', data);
                 await new Promise((resolve) => setTimeout(resolve, 1000));
                 
                toast.info('Режим разработки: Сообщение получено (Offline/Mock)', {
                    description: `Data: ${JSON.stringify(data)}`,
                });
                return { success: true, data: { success: true, mode: 'development-mock' } };
            }

            logger.error('[Email Service Error - Feedback]', { error });
            return { success: false, error: this.wrapError(error) };
        }
    }
}
