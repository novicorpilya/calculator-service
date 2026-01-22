import React, { type ReactNode } from 'react';
import {
    Inbox,
    Search,
    FileText,
    FolderOpen,
    Users,
    MessageSquare,
    ShoppingCart,
    Calendar,
    type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
    /** Type of empty state - determines default icon and message */
    type?: 'search' | 'data' | 'projects' | 'messages' | 'users' | 'orders' | 'calendar' | 'custom';
    /** Custom icon component */
    icon?: LucideIcon;
    /** Main title */
    title?: string;
    /** Description text */
    description?: string;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    /** Secondary action */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Custom content to render */
    children?: ReactNode;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional className */
    className?: string;
}

const typeConfig: Record<string, { icon: LucideIcon; title: string; description: string }> = {
    search: {
        icon: Search,
        title: 'Ничего не найдено',
        description: 'Попробуйте изменить параметры поиска',
    },
    data: {
        icon: FolderOpen,
        title: 'Нет данных',
        description: 'Данные появятся здесь после добавления',
    },
    projects: {
        icon: Inbox,
        title: 'Нет проектов',
        description: 'Создайте первый проект, чтобы начать работу',
    },
    messages: {
        icon: MessageSquare,
        title: 'Нет сообщений',
        description: 'Начните диалог, чтобы увидеть сообщения здесь',
    },
    users: {
        icon: Users,
        title: 'Нет пользователей',
        description: 'Пользователи появятся здесь после регистрации',
    },
    orders: {
        icon: ShoppingCart,
        title: 'Нет заказов',
        description: 'Заказы появятся здесь после оформления',
    },
    calendar: {
        icon: Calendar,
        title: 'Нет событий',
        description: 'Добавьте событие, чтобы начать планирование',
    },
    custom: {
        icon: FileText,
        title: 'Пусто',
        description: 'Здесь пока ничего нет',
    },
};

const sizeConfig = {
    sm: {
        wrapper: 'py-12',
        icon: 'w-12 h-12',
        iconContainer: 'w-16 h-16 rounded-2xl',
        title: 'text-base',
        description: 'text-[10px]',
    },
    md: {
        wrapper: 'py-20',
        icon: 'w-8 h-8 sm:w-10 sm:h-10',
        iconContainer: 'w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem]',
        title: 'text-lg sm:text-xl',
        description: 'text-[10px] sm:text-xs',
    },
    lg: {
        wrapper: 'py-24 sm:py-32',
        icon: 'w-10 h-10 sm:w-12 sm:h-12',
        iconContainer: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem]',
        title: 'text-xl sm:text-2xl',
        description: 'text-xs sm:text-sm',
    },
};

/**
 * Universal Empty State component
 * Provides consistent empty state UI across the application
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'data',
    icon,
    title,
    description,
    action,
    secondaryAction,
    children,
    size = 'md',
    className = '',
}) => {
    const config = typeConfig[type];
    const sizes = sizeConfig[size];
    const IconComponent = icon || config.icon;
    const ActionIcon = action?.icon;

    return (
        <div
            className={`
                text-center ${sizes.wrapper} 
                bg-card/50 rounded-[2rem] sm:rounded-[2.5rem] 
                border-2 border-dashed border-border-theme
                ${className}
            `}
            role="status"
            aria-label={title || config.title}
        >
            {/* Icon */}
            <div
                className={`
                ${sizes.iconContainer} 
                bg-primary/10 
                flex items-center justify-center 
                mx-auto mb-4 sm:mb-6
            `}
            >
                <IconComponent className={`${sizes.icon} text-primary/40`} aria-hidden="true" />
            </div>

            {/* Title */}
            <h3
                className={`${sizes.title} font-black uppercase tracking-tight text-foreground mb-2`}
            >
                {title || config.title}
            </h3>

            {/* Description */}
            <p
                className={`${sizes.description} font-bold uppercase tracking-widest text-foreground/50 mb-6 sm:mb-8 max-w-xs mx-auto`}
            >
                {description || config.description}
            </p>

            {/* Custom Content */}
            {children}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                        >
                            {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
                            {action.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
