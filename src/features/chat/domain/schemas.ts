import { z } from 'zod';

export const MessageSchema = z.object({
    id: z.string(),
    sender_id: z.string().uuid(),
    receiver_id: z.string().uuid(),
    content: z.string().nullable(),
    image_url: z.string().nullable().optional(),
    voice_url: z.string().nullable().optional(),
    voice_duration: z.number().nullable().optional(),
    is_edited: z.boolean().default(false),
    calculation_id: z.string().uuid().nullable().optional(),
    is_read: z.boolean().default(false),
    reply_to_id: z.string().uuid().nullable().optional(),
    created_at: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const RecipientSchema = z.object({
    id: z.string().uuid(),
    organization_name: z.string().nullable(),
    role: z.enum(['admin', 'manager', 'client']),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    lastMessage: z.object({
        content: z.string().nullable(),
        created_at: z.string().nullable(),
        sender_id: z.string().uuid().nullable(),
        image_url: z.string().nullable().optional(),
        voice_url: z.string().nullable().optional(),
    }).nullable().optional(),
});

export type ChatRecipient = z.infer<typeof RecipientSchema>;

export const UnreadCountSchema = z.record(z.string().uuid(), z.number());
export type UnreadCounts = z.infer<typeof UnreadCountSchema>;
