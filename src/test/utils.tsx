/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { ReactElement } from 'react';
import {
    render,
    renderHook,
    waitFor,
    screen,
    fireEvent,
    within,
    act,
} from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import { ServiceProvider } from '@/core/di/ServiceContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Message, ChatRecipient } from '@/features/chat/types';
import type { IChatService } from '@/features/chat/services/ChatService';

// ============================================
// MOCK DATA FACTORIES
// ============================================

export function createMockMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Test message content',
        created_at: new Date().toISOString(),
        is_edited: false,
        is_read: false,
        ...overrides,
    } as Message;
}

export function createMockRecipient(overrides: Partial<ChatRecipient> = {}): ChatRecipient {
    return {
        id: `user-${Date.now()}`,
        organization_name: 'Test Organization',
        role: 'client',
        first_name: 'John',
        last_name: 'Doe',
        ...overrides,
    };
}

// ============================================
// MOCK SERVICES
// ============================================

export const mockChatService = {
    getMessages: vi.fn().mockResolvedValue([]),
    getCalculationMessages: vi.fn().mockResolvedValue([]),
    getMessagesPaginated: vi.fn().mockResolvedValue({
        data: [],
        pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
        },
    }),
    sendMessage: vi.fn().mockImplementation(async (payload) => ({
        id: `msg-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
    })),
    editMessage: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    subscribeToMessages: vi.fn().mockReturnValue(() => {}),
    getRecipients: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    getUnreadCounts: vi.fn().mockResolvedValue({}),
    uploadAttachment: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
    uploadVoiceMessage: vi.fn().mockResolvedValue('https://example.com/voice.webm'),
    clearHistory: vi.fn().mockResolvedValue(undefined),
};

export const mockBroadcastService = {
    send: vi.fn().mockResolvedValue(true),
    broadcastNewMessage: vi.fn().mockResolvedValue(true),
    broadcastMessageUpdate: vi.fn().mockResolvedValue(true),
    broadcastMessageDelete: vi.fn().mockResolvedValue(true),
    broadcastMessagesRead: vi.fn().mockResolvedValue(true),
};

export const mockPresenceService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
    isOnline: vi.fn().mockReturnValue(false),
    getOnlineUsers: vi.fn().mockReturnValue(new Set<string>()),
    onOnlineUsersChange: vi.fn().mockReturnValue(() => {}),
};

// ============================================
// MOCK HOOKS
// ============================================

export const mockUseAuth = () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
});

export const mockUsePresence = () => ({
    isUserOnline: vi.fn().mockReturnValue(false),
    onlineUsersCount: 0,
});

// ============================================
// CUSTOM RENDER
// ============================================

interface WrapperProps {
    children: React.ReactNode;
}

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const AllProviders: React.FC<WrapperProps> = ({ children }) => {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <ServiceProvider services={{ chatService: mockChatService as unknown as IChatService }}>
                {children}
            </ServiceProvider>
        </QueryClientProvider>
    );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper: AllProviders, ...options });

function customRenderHook<Result, Props>(
    callback: (props: Props) => Result,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return renderHook(callback, { wrapper: AllProviders, ...options });
}

export {
    customRender as render,
    customRenderHook as renderHook,
    render as rtlRender,
    renderHook as rtlRenderHook,
    waitFor,
    act,
    screen,
    fireEvent,
    within,
    userEvent,
};
