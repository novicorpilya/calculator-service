/**
 * ChatContextMenu Component - Telegram Style
 * Context menu for message actions: Copy, Reply, Edit, Delete.
 */

import React, { useEffect, useRef } from 'react';
import { Copy, Pencil, Trash2, Reply } from 'lucide-react';
import type { ContextMenuState } from '../types';

interface ChatContextMenuProps {
    contextMenu: ContextMenuState;
    currentUserId: string;
    onClose: () => void;
    onCopy: () => void;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
    contextMenu,
    currentUserId,
    onClose,
    onCopy,
    onReply,
    onEdit,
    onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const isOwnMessage = contextMenu.message.sender_id === currentUserId;
    const hasContent = Boolean(contextMenu.message.content);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        // Use timeout to prevent immediate close from the same click
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Keep menu in viewport
    const getPosition = () => {
        const menuWidth = 180;
        const menuHeight = 200;

        let x = contextMenu.x;
        let y = contextMenu.y;

        // Adjust if menu would go off-screen
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        return { top: Math.max(10, y), left: Math.max(10, x) };
    };

    const pos = getPosition();

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Menu */}
            <div
                ref={menuRef}
                className="fixed z-50 bg-white dark:bg-[#1f1f1f] rounded-xl shadow-2xl py-2 min-w-[160px] animate-in zoom-in-95 fade-in duration-100 border border-gray-200/50 dark:border-white/10"
                style={pos}
            >
                {/* Reply */}
                <MenuItem icon={Reply} label="Ответить" onClick={() => handleAction(onReply)} />

                {/* Copy (only for text) */}
                {hasContent && (
                    <MenuItem icon={Copy} label="Копировать" onClick={() => handleAction(onCopy)} />
                )}

                {/* Edit (only own text messages) */}
                {isOwnMessage && hasContent && (
                    <MenuItem icon={Pencil} label="Изменить" onClick={() => handleAction(onEdit)} />
                )}

                {/* Divider before delete */}
                {isOwnMessage && (
                    <div className="my-1.5 mx-3 border-t border-gray-200 dark:border-white/10" />
                )}

                {/* Delete (only own messages) */}
                {isOwnMessage && (
                    <MenuItem
                        icon={Trash2}
                        label="Удалить"
                        onClick={() => handleAction(onDelete)}
                        danger
                    />
                )}
            </div>
        </>
    );
};

// MenuItem helper component
interface MenuItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick, danger }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
            ${
                danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
            }
        `}
    >
        <Icon size={18} />
        <span className="font-medium">{label}</span>
    </button>
);
