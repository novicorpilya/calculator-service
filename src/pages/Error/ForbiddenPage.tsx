import React from 'react';
import { ErrorPage } from './ErrorPage';

export const ForbiddenPage: React.FC = () => (
    <ErrorPage 
        code="403"
        title="Доступ ограничен"
        description="У вас недостаточно прав для просмотра этого раздела. Если вы считаете, что это ошибка, обратитесь к администратору."
    />
);
