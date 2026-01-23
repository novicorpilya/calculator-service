import { SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult } from '@/core/types/results';
import { logger } from '@/core/logging/index';

export interface ProjectReview {
    id: string;
    calculation_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    created_at: string;
}

export interface IReviewService {
    submitReview(
        calculationId: string,
        userId: string,
        rating: number,
        comment?: string
    ): Promise<ActionResult<ProjectReview>>;
    getReviewByCalculation(calculationId: string): Promise<ActionResult<ProjectReview | null>>;
}

export class ReviewService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async submitReview(
        calculationId: string,
        userId: string,
        rating: number,
        comment?: string
    ): Promise<ActionResult<ProjectReview>> {
        try {
            // 1. Insert review record
            const { data, error } = await this.supabase
                .from('calculation_reviews')
                .insert({
                    calculation_id: calculationId,
                    user_id: userId,
                    rating,
                    comment,
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Find and update the rating_card message to show it as "Submitted"
            const { data: messages } = await this.supabase
                .from('messages')
                .select('id, metadata')
                .eq('calculation_id', calculationId)
                .eq('message_type', 'rating_card')
                .limit(1);

            if (messages && messages.length > 0) {
                const msg = messages[0];
                await this.supabase
                    .from('messages')
                    .update({
                        metadata: { ...msg.metadata, rating_value: rating },
                    })
                    .eq('id', msg.id);
            }

            // 3. Insert a nice system notification message
            const stars = '⭐'.repeat(rating);
            await this.supabase.from('messages').insert({
                calculation_id: calculationId,
                sender_id: userId, // From the client
                content: `Клиент оценил качество обслуживания: ${rating} из 5 ${stars}${comment ? `\n\n"${comment}"` : ''}`,
                message_type: 'text',
                metadata: { is_system: true, type: 'review_announcement' },
            });

            return { success: true, data };
        } catch (error) {
            logger.error('[ReviewService:submitReview]', { calculationId, error });
            return {
                success: false,
                error: {
                    message:
                        error instanceof Error ? error.message : 'Ошибка при сохранении отзыва',
                },
            };
        }
    }

    async getReviewByCalculation(
        calculationId: string
    ): Promise<ActionResult<ProjectReview | null>> {
        try {
            const { data, error } = await this.supabase
                .from('calculation_reviews')
                .select('*')
                .eq('calculation_id', calculationId)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            logger.error('[ReviewService:getReview]', { calculationId, error });
            return { success: false, error: { message: 'Ошибка при получении отзыва' } };
        }
    }
}
