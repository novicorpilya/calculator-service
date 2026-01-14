import React from 'react';
import { AuthContext, type AuthContextType } from '@/app/providers/AuthProvider';

export function useAuth(): AuthContextType {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// Export type for external use
export type { AuthContextType };
