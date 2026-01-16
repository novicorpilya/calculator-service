import { BaseChatRepository } from './BaseChatRepository';
import type { ActionResult } from '@/core/types/results';
import { filePathForBucket } from '../utils/chatUtils';

export class AttachmentChatRepository extends BaseChatRepository {
    async uploadFile(file: File | Blob, bucket: string): Promise<ActionResult<string>> {
        try {
            const fileExt = file instanceof File ? file.name.split('.').pop() : 'webm';
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = filePathForBucket(bucket, fileName);

            this.logger.info(`Starting file upload to ${bucket}`, { fileName });
            const { error: uploadError } = await this.client.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                this.logger.error(`Failed to upload to ${bucket}`, { filePath }, uploadError);
                return { success: false, error: this.wrapError(uploadError) };
            }

            const { data } = this.client.storage.from(bucket).getPublicUrl(filePath);
            this.logger.info(`Upload complete`, { publicUrl: data.publicUrl });
            return { success: true, data: data.publicUrl };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getSignedUrl(path: string, bucket: string, expiresIn: number): Promise<ActionResult<string>> {
        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: data.signedUrl };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
