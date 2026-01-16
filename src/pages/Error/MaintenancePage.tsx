import React from 'react';
import { ErrorPage } from './ErrorPage';

export const MaintenancePage: React.FC = () => (
    <ErrorPage 
        code="maintenance"
        title="Техническое обслуживание"
        description="Мы проводим плановые работы для улучшения сервиса. Мы скоро вернемся! Приносим извинения за неудобства."
        showHomeButton={false}
        showBackButton={false}
    />
);
