import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@/test/utils';
import { useMessages } from '@/features/chat/hooks/useMessages';

describe('useMessages', () => {
    const defaultOptions = {
        currentUserId: 'user-1',
        selectedUserId: 'user-2',
    };

    it('should load messages from service', async () => {
        const { result } = renderHook(() => useMessages(defaultOptions));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        }, { timeout: 5000 });

        expect(Array.isArray(result.current.messages)).toBe(true);
    });

    it('should handle sendMessage mutation', async () => {
        const { result } = renderHook(() => useMessages(defaultOptions));

        // sendMessage is present
        expect(typeof result.current.sendMessage).toBe('function');
    });
});
