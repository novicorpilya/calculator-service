import { ApplicationError, InfrastructureError } from './AppErrors';

export interface UserFriendlyError {
    title: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export class ErrorMapper {
    static toUserFriendly(error: unknown): UserFriendlyError {
        if (error instanceof ApplicationError) {
            return {
                title: 'Ошибка приложения',
                message: error.message,
                severity: 'warning',
            };
        }

        if (error instanceof InfrastructureError) {
            return {
                title: 'Ошибка соединения',
                message: 'Проблемы с доступом к сети или базе данных. Попробуйте позже.',
                severity: 'error',
            };
        }

        // Default error mapping
        return {
            title: 'Произошла непредвиденная ошибка',
            message: error instanceof Error ? error.message : 'Неизвестная ошибка',
            severity: 'error',
        };
    }
}
