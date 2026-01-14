/**
 * MessageList Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MessageList } from '@/features/chat/components/MessageList';
import type { Message } from '../types';

const createMessage = (overrides: Partial<Message> = {}): Message =>
    ({
        id: `msg-${Date.now()}`,
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Test message',
        created_at: new Date().toISOString(),
        is_edited: false,
        ...overrides,
    }) as Message;

describe('MessageList', () => {
    const defaultProps = {
        messages: [] as Message[],
        currentUserId: 'user-1',
        isLoading: false,
        searchQuery: '',
        onContextMenu: vi.fn(),
        onImageClick: vi.fn(),
    };

    describe('loading state', () => {
        it('should show loading spinner/indicator', () => {
            render(<MessageList {...defaultProps} isLoading={true} />);

            // Clock has animate-pulse class in current implementation
            const pulse = document.querySelector('.animate-pulse');
            expect(pulse).toBeTruthy();
        });
    });

    describe('empty state', () => {
        it('should show empty message when no messages', () => {
            render(<MessageList {...defaultProps} messages={[]} />);

            expect(screen.getByText(/начните общение первым/i)).toBeTruthy();
        });
    });

    describe('messages rendering', () => {
        it('should render messages', () => {
            const messages = [
                createMessage({ id: '1', content: 'Hello from user 1' }),
                createMessage({ id: '2', sender_id: 'user-2', content: 'Hello from user 2' }),
            ];

            render(<MessageList {...defaultProps} messages={messages} />);

            expect(screen.getByText('Hello from user 1')).toBeTruthy();
            expect(screen.getByText('Hello from user 2')).toBeTruthy();
        });

        it('should style own messages differently', () => {
            const messages = [
                createMessage({ id: '1', sender_id: 'user-1', content: 'My message' }),
            ];

            const { container } = render(<MessageList {...defaultProps} messages={messages} />);

            // Own messages should have justify-end class
            const messageWrapper = container.querySelector('.justify-end');
            expect(messageWrapper).toBeTruthy();
        });

        it('should style other messages differently', () => {
            const messages = [
                createMessage({ id: '1', sender_id: 'user-2', content: 'Their message' }),
            ];

            const { container } = render(<MessageList {...defaultProps} messages={messages} />);

            // Other messages should have justify-start class
            const messageWrapper = container.querySelector('.justify-start');
            expect(messageWrapper).toBeTruthy();
        });
    });

    describe('search highlighting', () => {
        it('should highlight search terms', () => {
            const messages = [createMessage({ content: 'Hello world this is a test' })];

            render(<MessageList {...defaultProps} messages={messages} searchQuery="world" />);

            // Should still show the content
            expect(screen.getByText(/test/)).toBeTruthy();
        });

        it('should filter messages when searching', () => {
            const messages = [
                createMessage({ id: '1', content: 'Hello world' }),
                createMessage({ id: '2', content: 'Goodbye moon' }),
            ];

            render(<MessageList {...defaultProps} messages={messages} searchQuery="world" />);

            // Should find elements with "world" (might be wrapped in span)
            expect(screen.getAllByText(/world/i).length).toBeGreaterThan(0);
            expect(screen.queryByText(/Goodbye moon/)).toBeNull();
        });
    });

    describe('context menu', () => {
        it('should call onContextMenu on right click', () => {
            const onContextMenu = vi.fn();
            const messages = [createMessage({ content: 'Right click me' })];

            render(
                <MessageList {...defaultProps} messages={messages} onContextMenu={onContextMenu} />
            );

            // Find the bubble container
            const messageText = screen.getByText('Right click me');
            const bubble = messageText.closest('.cursor-context-menu');

            if (bubble) {
                bubble.dispatchEvent(
                    new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
                );
            }

            expect(onContextMenu).toHaveBeenCalled();
        });
    });

    describe('image messages', () => {
        it('should render image messages', () => {
            const messages = [
                createMessage({
                    content: '',
                    image_url: 'https://example.com/image.jpg',
                }),
            ];

            render(<MessageList {...defaultProps} messages={messages} />);

            const img = screen.getByAltText('Изображение в сообщении');
            expect(img).toBeTruthy();
            expect(img.getAttribute('src')).toBe('https://example.com/image.jpg');
        });

        it('should call onImageClick when image clicked', async () => {
            const onImageClick = vi.fn();
            const messages = [
                createMessage({
                    content: '',
                    image_url: 'https://example.com/image.jpg',
                }),
            ];

            render(
                <MessageList {...defaultProps} messages={messages} onImageClick={onImageClick} />
            );

            const img = screen.getByAltText('Изображение в сообщении');
            img.click();

            expect(onImageClick).toHaveBeenCalledWith('https://example.com/image.jpg');
        });

        it('should show loading state for temp images', () => {
            const messages = [
                createMessage({
                    id: 'temp-12345',
                    content: '',
                    image_url: 'blob:https://example.com/temp',
                }),
            ];

            const { container } = render(<MessageList {...defaultProps} messages={messages} />);

            // In our implementation, ChatImage might be blurred.
            // In MessageList.tsx, ChatImage component is passed isTemp={true}.
            // We check for blur class in the rendered output.
            const blurredImg = container.querySelector('img.blur-2xl'); // ChatImage uses blur-2xl
            expect(blurredImg).toBeTruthy();
        });
    });

    describe('edited messages', () => {
        it('should show edited indicator', () => {
            const messages = [createMessage({ content: 'Edited message', is_edited: true })];

            render(<MessageList {...defaultProps} messages={messages} />);

            expect(screen.getByText('изм.')).toBeTruthy();
        });
    });

    describe('reply messages', () => {
        it('should show reply context', () => {
            const messages = [
                createMessage({ id: 'original', content: 'Original message' }),
                createMessage({ id: 'reply', content: 'Reply message', reply_to_id: 'original' }),
            ];

            render(<MessageList {...defaultProps} messages={messages} />);

            expect(screen.getByText('Ответ на сообщение')).toBeTruthy();
            // Should find the original message and the content in the reply preview
            expect(screen.getAllByText('Original message').length).toBeGreaterThanOrEqual(1);
        });
    });
});
