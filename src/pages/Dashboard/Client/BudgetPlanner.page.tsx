import React from 'react';
import { BudgetPlannerWizard } from '@/features/budget-planner/components/BudgetPlannerWizard';

/**
 * Budget Planner Page.
 * Refactored to remove Layout as it's now handled by DashboardLayout.
 */
const BudgetPlannerPage: React.FC = () => {
    return (
        <div className="w-full h-full bg-transparent flex flex-col p-4 sm:p-6 lg:p-8">
            <BudgetPlannerWizard />
        </div>
    );
};

export default BudgetPlannerPage;
