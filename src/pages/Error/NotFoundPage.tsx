import React from 'react';
import { ErrorPage } from './ErrorPage';

export const NotFoundPage: React.FC = () => (
    <ErrorPage 
        code="404"
        title="Страница не найдена"
        description="К сожалению, такой страницы не существует или она была перенесена. Проверьте правильность адреса."
    />
);
