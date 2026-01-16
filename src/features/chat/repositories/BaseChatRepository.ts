import { type SupabaseClient } from '@supabase/supabase-js';
import { type ILogger } from '@/core/logging/LogManager';
import { z } from 'zod';
import { MessageSchema, type Message } from '../types';
import type { ActionResult } from '@/core/types/results';

/**
 * Base Repository for Chat operations.
 * Provides shared utilities for error wrapping and data validation.
 */
export abstract class BaseChatRepository {
    protected client: SupabaseClient;
    protected logger: ILogger;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.client = client;
        this.logger = logger;
    }

    protected wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    protected validateMessage(data: unknown): ActionResult<Message> {
        const validated = MessageSchema.safeParse(data);
        if (!validated.success) {
            this.logger.error('Message data validation failed', { error: validated.error });
            return { success: false, error: { message: 'Data format error' } };
        }
        return { success: true, data: validated.data };
    }

    protected validateMessages(data: unknown): ActionResult<Message[]> {
        const validated = z.array(MessageSchema).safeParse(data);
        if (!validated.success) {
            this.logger.error('Messages array validation failed', { error: validated.error });
            return { success: false, error: { message: 'Data format error' } };
        }
        return { success: true, data: validated.data };
    }
}
