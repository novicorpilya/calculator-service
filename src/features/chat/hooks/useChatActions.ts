import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import type { Message, MessageCreatePayload } from '../types';
import { sortMessages } from '../utils/chatUtils';

interface SendImageParams {
    file: File;
    previewUrl: string;
    sender_id: string;
    receiver_id?: string | null;
    calculation_id?: string | null;
}

interface SendVoiceParams {
    blob: Blob;
    previewUrl: string;
    duration: number;
    sender_id: string;
    receiver_id?: string | null;
    calculation_id?: string | null;
}

export function useChatActions(currentUserId: string, selectedUserId: string) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const queryKey = ['messages', currentUserId, selectedUserId];

    const sendMutation = useMutation({
        mutationFn: async (params: MessageCreatePayload) => {
            const res = await chatService.sendMessage(params);
            if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
            return res.data;
        },
        onMutate: async (newMessage: MessageCreatePayload) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                content: newMessage.content,
                sender_id: newMessage.sender_id,
                receiver_id: newMessage.receiver_id ?? null,
                calculation_id: newMessage.calculation_id || null,
                created_at: new Date().toISOString(),
                is_read: false,
                is_edited: false,
                metadata: newMessage.metadata || {},
                is_optimistic: true,
            };

            queryClient.setQueryData<Message[]>(queryKey, (old = []) => 
                sortMessages([...old, optimisticMessage])
            );

            return { previousMessages };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
                const filtered = old.filter((m) => !m.is_optimistic);
                return sortMessages([...filtered, data]);
            });
            // Update counts
            queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
        },
        onError: (_err, _newMessage, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(queryKey, context.previousMessages);
            }
        },
    });

    const sendImageMutation = useMutation({
        mutationFn: async (params: SendImageParams & { client_message_id?: string }) => {
            const payload: MessageCreatePayload = {
                sender_id: params.sender_id,
                receiver_id: params.receiver_id,
                calculation_id: params.calculation_id,
                content: '',
                image_url: params.previewUrl,
                client_message_id: params.client_message_id,
            };
            const res = await chatService.sendMediaMessage(params.file, payload);
            if (!res.success || !res.data) throw new Error(res.error?.message || 'Upload failed');
            return res.data;
        },
        onMutate: async (params: SendImageParams & { client_message_id?: string }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const optimistic: Message = {
                id: params.client_message_id || `temp-img-${Date.now()}`,
                client_message_id: params.client_message_id,
                content: '',
                image_url: params.previewUrl,
                sender_id: params.sender_id,
                receiver_id: params.receiver_id || null,
                calculation_id: params.calculation_id || null,
                created_at: new Date().toISOString(),
                is_read: false,
                is_edited: false,
                is_optimistic: true,
            };

            queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, optimistic]);
            return { previousMessages };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
                const filtered = old.filter((m) => !m.is_optimistic);
                return sortMessages([...filtered, data]);
            });
        },
        onError: (_err, _vars, context) => {
            if (context?.previousMessages) queryClient.setQueryData(queryKey, context.previousMessages);
        },
    });

    const sendVoiceMutation = useMutation({
        mutationFn: async (params: SendVoiceParams & { client_message_id?: string }) => {
            const payload: MessageCreatePayload = {
                sender_id: params.sender_id,
                receiver_id: params.receiver_id,
                calculation_id: params.calculation_id,
                content: '',
                voice_url: params.previewUrl,
                voice_duration: params.duration,
                client_message_id: params.client_message_id,
            };
            const res = await chatService.sendMediaMessage(params.blob, payload);
            if (!res.success || !res.data) throw new Error(res.error?.message || 'Voice upload failed');
            return res.data;
        },
        onMutate: async (params: SendVoiceParams & { client_message_id?: string }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const optimistic: Message = {
                id: params.client_message_id || `temp-voice-${Date.now()}`,
                client_message_id: params.client_message_id,
                content: '',
                voice_url: params.previewUrl,
                sender_id: params.sender_id,
                receiver_id: params.receiver_id || null,
                calculation_id: params.calculation_id || null,
                created_at: new Date().toISOString(),
                is_read: false,
                is_edited: false,
                is_optimistic: true,
                metadata: { voice_duration: params.duration },
            };

            queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, optimistic]);
            return { previousMessages };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
                const filtered = old.filter((m) => !m.is_optimistic);
                return sortMessages([...filtered, data]);
            });
        },
        onError: (_err, _vars, context) => {
            if (context?.previousMessages) queryClient.setQueryData(queryKey, context.previousMessages);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await chatService.deleteMessage(id);
            if (!res.success) throw new Error(res.error?.message || 'Delete failed');
            return id;
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData<Message[]>(queryKey, (old = []) => old.filter((m) => m.id !== id));
            return { previousMessages };
        },
        onError: (_err, _id, context) => {
            if (context?.previousMessages) queryClient.setQueryData(queryKey, context.previousMessages);
        },
    });

    const editMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const res = await chatService.editMessage(id, content);
            if (!res.success) throw new Error(res.error?.message || 'Edit failed');
            return { id, content };
        },
        onMutate: async ({ id, content }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
                old.map((m) => (m.id === id ? { ...m, content, is_edited: true } : m))
            );
            return { previousMessages };
        },
    });

    return {
        sendMessage: sendMutation.mutate,
        sendImage: (params: SendImageParams) => {
            sendImageMutation.mutate({ ...params, client_message_id: crypto.randomUUID() });
        },
        sendVoice: (params: SendVoiceParams) => {
            sendVoiceMutation.mutate({ ...params, client_message_id: crypto.randomUUID() });
        },
        deleteMessage: deleteMutation.mutate,
        editMessage: editMutation.mutate,
        isSending: sendMutation.isPending || sendImageMutation.isPending || sendVoiceMutation.isPending,
    };
}
