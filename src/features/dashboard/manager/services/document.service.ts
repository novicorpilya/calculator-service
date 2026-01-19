import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { wrapError } from '@/core/utils/errors';
import type { ActionResult, VoidResult } from '@/core/types/results';

export const DocumentSchema = z.object({
    id: z.string().uuid(),
    calculation_id: z.string().uuid(),
    version_id: z.string().uuid().nullable().optional(),
    type: z.enum(['kp', 'invoice', 'act', 'other']),
    file_path: z.string(),
    file_name: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    created_at: z.string(),
    created_by: z.string().uuid().nullable(),
});

export type Document = z.infer<typeof DocumentSchema>;

export interface IDocumentService {
    registerDocument(doc: Omit<Document, 'id' | 'created_at' | 'created_by'>): Promise<ActionResult<Document>>;
    getDocuments(calculationId: string): Promise<ActionResult<Document[]>>;
    deleteDocument(documentId: string): Promise<VoidResult>;
}

export class DocumentService implements IDocumentService {
    private supabase: SupabaseClient;
    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async registerDocument(doc: Omit<Document, 'id' | 'created_at' | 'created_by'>): Promise<ActionResult<Document>> {
        try {
            const {
                data: { user },
            } = await this.supabase.auth.getUser();

            const { data, error } = await this.supabase
                .from('documents')
                .insert({
                    ...doc,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: data as Document };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getDocuments(calculationId: string): Promise<ActionResult<Document[]>> {
        try {
            const { data, error } = await this.supabase
                .from('documents')
                .select('*')
                .eq('calculation_id', calculationId)
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: data as Document[] };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async deleteDocument(documentId: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('documents')
                .delete()
                .eq('id', documentId);

            if (error) return { success: false, error: wrapError(error) };

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
