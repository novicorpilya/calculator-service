import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { MessageContextMenu } from './MessageContextMenu';
import { MessageList } from './MessageList';
import type { Message, ChatRecipient } from '../types';
import type { User } from '@/features/auth/auth.types';
import { logger } from '@/core/logging';
import { toast } from 'sonner';

// Components
import { ChatHeader } from './window/ChatHeader';
import { ChatInput } from './window/ChatInput';

interface ChatWindowProps {
    currentUser: User;
    selectedUser: ChatRecipient | null;
    isOnline: boolean;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (params: {
        sender_id: string;
        receiver_id: string;
        content: string;
        reply_to_id?: string;
    }) => Promise<unknown>;
    onSendImage: (params: {
        file: File;
        previewUrl: string;
        sender_id?: string;
        receiver_id?: string;
        content?: string;
        reply_to_id?: string;
    }) => Promise<unknown>;
    onSendVoice: (params: {
        blob: Blob;
        previewUrl: string;
        duration: number;
        sender_id?: string;
        receiver_id?: string;
        reply_to_id?: string;
    }) => Promise<unknown>;
    onEditMessage?: (id: string, content: string) => Promise<void>;
    onClearHistory: () => Promise<void>;
    onDeleteMessage?: (id: string) => Promise<void>;
    onBack?: () => void;
    onMarkAsRead?: (messageId: string) => Promise<void>;
}

export const ChatWindow = React.memo<ChatWindowProps>(
    ({
        currentUser,
        selectedUser,
        isOnline,
        messages,
        isLoading,
        onSendMessage,
        onSendImage,
        onSendVoice,
        onEditMessage,
        onDeleteMessage,
        onBack,
        onMarkAsRead,
    }) => {
        const [newMessage, setNewMessage] = useState('');
        const [pendingAttachments, setPendingAttachments] = useState<
            { file: File; preview: string }[]
        >([]);
        const [isRecordingVoice, setIsRecordingVoice] = useState(false);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [previewImage, setPreviewImage] = useState<string | null>(null);

        // Context Menu & Actions
        const [contextMenu, setContextMenu] = useState<{
            x: number;
            y: number;
            message: Message;
        } | null>(null);
        const [replyingTo, setReplyingTo] = useState<Message | null>(null);
        const [editingMessage, setEditingMessage] = useState<Message | null>(null);

        const emojiPickerRef = useRef<HTMLDivElement>(null);

        const handleRemoveAttachment = React.useCallback((idx: number, preview: string) => {
            URL.revokeObjectURL(preview);
            setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
        }, []);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    emojiPickerRef.current &&
                    !emojiPickerRef.current.contains(event.target as Node)
                ) {
                    setShowEmojiPicker(false);
                }
            };
            if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showEmojiPicker]);

        const handleEmojiClick = React.useCallback((emojiData: EmojiClickData) => {
            setNewMessage((prev) => prev + emojiData.emoji);
            setShowEmojiPicker(false);
        }, []);

        const handleFileSelect = React.useCallback(
            async (e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0 || !selectedUser) return;
                const newAttachments: { file: File; preview: string }[] = [];
                for (const file of files) {
                    if (!file.type.startsWith('image/')) continue;
                    newAttachments.push({ file, preview: URL.createObjectURL(file) });
                }
                setPendingAttachments((prev) => [...prev, ...newAttachments]);
            },
            [selectedUser]
        );

        const handleFormSubmit = React.useCallback(
            async (e: React.FormEvent) => {
                e.preventDefault();
                const text = newMessage.trim();
                const attachments = [...pendingAttachments];

                if (editingMessage) {
                    if (!text || !onEditMessage) return;
                    try {
                        await onEditMessage(editingMessage.id, text);
                        setEditingMessage(null);
                        setNewMessage('');
                    } catch {
                        toast.error('Не удалось изменить сообщение');
                    }
                    return;
                }

                if ((!text && attachments.length === 0) || !selectedUser) return;

                setNewMessage('');
                setPendingAttachments([]);
                const replyId = replyingTo?.id;
                setReplyingTo(null);

                try {
                    if (attachments.length > 0) {
                        for (let i = 0; i < attachments.length; i++) {
                            const att = attachments[i];
                            await onSendImage({
                                file: att.file,
                                previewUrl: att.preview,
                                sender_id: currentUser.id,
                                receiver_id: selectedUser.id,
                                content: i === 0 ? text : '',
                                reply_to_id: i === 0 ? replyId : undefined,
                            });
                        }
                    } else {
                        await onSendMessage({
                            sender_id: currentUser.id,
                            receiver_id: selectedUser.id,
                            content: text,
                            reply_to_id: replyId,
                        });
                    }
                } catch (error) {
                    logger.error(
                        'Failed to send message via form',
                        {
                            userId: currentUser.id,
                            recipientId: selectedUser.id,
                            hasAttachments: attachments.length > 0,
                        },
                        error
                    );
                    toast.error('Не удалось отправить сообщение');
                }
            },
            [
                newMessage,
                pendingAttachments,
                selectedUser,
                currentUser.id,
                onSendImage,
                onSendMessage,
                editingMessage,
                onEditMessage,
                replyingTo?.id,
            ]
        );

        const handleVoiceComplete = React.useCallback(
            async (audioBlob: Blob, duration: number) => {
                if (!selectedUser) return;
                const previewUrl = URL.createObjectURL(audioBlob);
                setIsRecordingVoice(false);
                try {
                    await onSendVoice({
                        blob: audioBlob,
                        previewUrl,
                        duration,
                        sender_id: currentUser.id,
                        receiver_id: selectedUser.id,
                    });
                } catch (error) {
                    logger.error(
                        'Failed to send voice message',
                        {
                            userId: currentUser.id,
                            recipientId: selectedUser.id,
                            duration,
                        },
                        error
                    );
                    toast.error('Не удалось отправить голосовое сообщение');
                }
            },
            [selectedUser, currentUser.id, onSendVoice]
        );

        const handleEmojiToggle = React.useCallback(() => setShowEmojiPicker((prev) => !prev), []);
        const handleVoiceStart = React.useCallback(() => setIsRecordingVoice(true), []);
        const handleImagePreviewClose = React.useCallback(() => setPreviewImage(null), []);
        const handleImageClick = React.useCallback((url: string) => setPreviewImage(url), []);

        const handleContextMenu = React.useCallback((e: React.MouseEvent, message: Message) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, message });
        }, []);

        const handleCopyMessage = React.useCallback((content: string) => {
            navigator.clipboard.writeText(content);
            toast.success('Скопировано в буфер обмена');
        }, []);

        const handleReplyMessage = React.useCallback((message: Message) => {
            setEditingMessage(null);
            setReplyingTo(message);
        }, []);

        const handleEditMessage = React.useCallback((message: Message) => {
            setReplyingTo(null);
            setEditingMessage(message);
            setNewMessage(message.content || '');
        }, []);

        const handleCancelAction = React.useCallback(() => {
            setReplyingTo(null);
            setEditingMessage(null);
            if (editingMessage) setNewMessage('');
        }, [editingMessage]);

        const handleContextMenuClose = React.useCallback(() => setContextMenu(null), []);

        const handleContextMenuDelete = React.useCallback(async () => {
            if (!contextMenu?.message) return;
            if (onDeleteMessage) {
                await onDeleteMessage(contextMenu.message.id);
            }
        }, [contextMenu, onDeleteMessage]);

        const handleContextMenuEdit = React.useCallback(() => {
            if (contextMenu?.message) handleEditMessage(contextMenu.message);
        }, [contextMenu, handleEditMessage]);

        const handleContextMenuReply = React.useCallback(() => {
            if (contextMenu?.message) handleReplyMessage(contextMenu.message);
        }, [contextMenu, handleReplyMessage]);

        const handleContextMenuCopy = React.useCallback(() => {
            if (contextMenu?.message?.content) handleCopyMessage(contextMenu.message.content);
        }, [contextMenu, handleCopyMessage]);

        if (!selectedUser) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 bg-background">
                    <MessageSquare size={64} className="mb-8" />
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">
                        Ваш центр связи
                    </h3>
                    <p className="max-w-xs text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Выберите собеседника из списка слева, чтобы начать общение напрямую с
                        экспертом.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
                <ChatHeader selectedUser={selectedUser} onBack={onBack} isOnline={isOnline} />

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
                    <MessageList
                        messages={messages}
                        currentUserId={currentUser.id}
                        isLoading={isLoading}
                        searchQuery=""
                        onContextMenu={handleContextMenu}
                        onImageClick={handleImageClick}
                        onMessageRead={onMarkAsRead}
                        recipientAvatarUrl={selectedUser.avatar_url || undefined}
                        currentUserAvatarUrl={currentUser.avatarUrl || undefined}
                    />
                </div>

                <ChatInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    pendingAttachments={pendingAttachments}
                    handleRemoveAttachment={handleRemoveAttachment}
                    handleFileSelect={handleFileSelect}
                    handleFormSubmit={handleFormSubmit}
                    handleEmojiToggle={handleEmojiToggle}
                    showEmojiPicker={showEmojiPicker}
                    handleEmojiClick={handleEmojiClick}
                    isRecordingVoice={isRecordingVoice}
                    setIsRecordingVoice={setIsRecordingVoice}
                    handleVoiceComplete={handleVoiceComplete}
                    handleVoiceStart={handleVoiceStart}
                    replyingTo={replyingTo}
                    editingMessage={editingMessage}
                    handleCancelAction={handleCancelAction}
                    emojiPickerRef={emojiPickerRef}
                />

                {previewImage && (
                    <ImagePreviewModal imageUrl={previewImage} onClose={handleImagePreviewClose} />
                )}

                {contextMenu && (
                    <MessageContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        isOwn={contextMenu.message.sender_id === currentUser.id}
                        canEdit={!contextMenu.message.image_url && !contextMenu.message.voice_url}
                        canCopy={!!contextMenu.message.content && !contextMenu.message.voice_url}
                        onClose={handleContextMenuClose}
                        onCopy={handleContextMenuCopy}
                        onDelete={handleContextMenuDelete}
                        onEdit={handleContextMenuEdit}
                        onReply={handleContextMenuReply}
                    />
                )}
            </div>
        );
    }
);
