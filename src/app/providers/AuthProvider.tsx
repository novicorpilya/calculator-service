import React, { useCallback } from 'react';
import { supabase } from '@/services/supabase.service';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { authService } from '@/features/auth/auth.service';
import { useProfileSync } from '@/features/auth/hooks/useProfileSync';
import { checkIsRecoveryFlow } from '@/features/auth/utils/authPathUtils';
import { logger } from '@/core/logging/index.ts';
import type {
    User,
    LoginCredentials,
    RegisterCredentials,
    UpdateProfileData,
    ActionResult,
} from '@/features/auth/auth.types';

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (credentials: LoginCredentials) => Promise<ActionResult<User>>;
    register: (credentials: RegisterCredentials) => Promise<ActionResult<User>>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<ActionResult<void>>;
    updatePassword: (password: string) => Promise<ActionResult<void>>;
    updateProfile: (updates: UpdateProfileData) => Promise<ActionResult<User>>;
    uploadAvatar: (file: File) => Promise<ActionResult<string>>;
    setIsAuthenticated: (value: boolean) => void;
    setIsRecoveryFlow: (value: boolean) => void;
    error: string | null;
    loading: boolean;
    isInitializing: boolean;
    isRecoveryFlow: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState<User | null>(null);
    const [token, setToken] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [isInitializing, setIsInitializing] = React.useState(true);
    const [isRecoveryFlow, setIsRecoveryFlow] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(true);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authService.logout();
            if (!res.success) {
                logger.error('Logout error', res.error);
            }
        } finally {
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setIsRecoveryFlow(false);
            setLoading(false);
        }
    }, []);

    // Realtime Profile Synchronization
    useProfileSync({
        userId: user?.id,
        isMounted,
        onProfileUpdate: (updatedUser) => {
            // Fix Role Desync: if role changed in DB, force logout
            if (user && user.role !== updatedUser.role) {
                toast.error('Ваши права доступа изменились. Пожалуйста, войдите снова.');
                logout();
            } else {
                setUser(updatedUser);
            }
        },
        onSyncError: () => logout(),
    });

    React.useEffect(() => {
        setIsMounted(true);

        const init = async () => {
            try {
                if (checkIsRecoveryFlow()) setIsRecoveryFlow(true);
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session) {
                    setToken(session.access_token);
                    const res = await authService.getCurrentUser();

                    if (res.success && res.data) {
                        const userProfile = res.data;
                        if (userProfile.status === 'blocked') {
                            await logout();
                            return;
                        }
                        setUser(userProfile);
                        if (!checkIsRecoveryFlow()) setIsAuthenticated(true);
                    } else {
                        await logout();
                    }
                }
            } catch {
                // Silent catch for init errors
            } finally {
                setIsInitializing(false);
            }
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            if (session) {
                setToken(session.access_token);
                if (event === 'PASSWORD_RECOVERY') setIsRecoveryFlow(true);

                if (session.user) {
                    authService
                        .getUserProfile(session.user.id)
                        .then((res) => {
                            if (res.success && res.data) {
                                const profile = res.data;
                                if (profile.status === 'blocked') {
                                    logout();
                                    return;
                                }
                                setUser(profile);
                            } else {
                                logout();
                            }
                        })
                        .catch(() => {
                            logout();
                        });
                }
            } else if (event === 'SIGNED_OUT') {
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                setIsRecoveryFlow(false);
            }
        });

        init();

        return () => {
            setIsMounted(false);
            subscription.unsubscribe();
        };
    }, [logout]);

    const login = async (credentials: LoginCredentials): Promise<ActionResult<User>> => {
        setLoading(true);
        setError(null);
        const result = await authService.login(credentials);

        if (result.success && result.data) {
            setToken(result.data.token);
            setUser(result.data.user);
            setLoading(false);
            return { success: true, data: result.data.user };
        } else {
            const msg = result.error?.message || 'Login failed';
            setError(msg);
            setLoading(false);
            return { success: false, error: { message: msg } };
        }
    };

    const register = async (credentials: RegisterCredentials): Promise<ActionResult<User>> => {
        setLoading(true);
        setError(null);
        const result = await authService.register(credentials);

        if (result.success && result.data) {
            setToken(result.data.token);
            setUser(result.data.user);
            setLoading(false);
            return { success: true, data: result.data.user };
        } else {
            const msg = result.error?.message || 'Registration failed';
            setError(msg);
            setLoading(false);
            return { success: false, error: { message: msg } };
        }
    };

    const resetPassword = async (email: string): Promise<ActionResult<void>> => {
        setLoading(true);
        setError(null);
        const result = await authService.resetPassword(email);
        if (!result.success) {
            setError(result.error?.message || 'Password reset failed');
        }
        setLoading(false);
        return result;
    };

    const updatePassword = async (password: string): Promise<ActionResult<void>> => {
        setError(null);
        const result = await authService.updatePassword(password);
        if (!result.success) setError(result.error?.message || 'Password update failed');
        return result;
    };

    const updateProfile = async (updates: UpdateProfileData): Promise<ActionResult<User>> => {
        if (!user) return { success: false, error: { message: 'Пользователь не авторизован' } };
        setLoading(true);
        setError(null);
        const result = await authService.updateProfile(user.id, updates);

        if (result.success && result.data) {
            setUser(result.data);
        } else {
            setError(result.error?.message || 'Profile update failed');
        }

        setLoading(false);
        return result;
    };
    const uploadAvatar = async (file: File): Promise<ActionResult<string>> => {
        if (!user) return { success: false, error: { message: 'Пользователь не авторизован' } };
        setLoading(true);
        const result = await authService.uploadAvatar(user.id, file);
        setLoading(false);
        return result;
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                token,
                login,
                register,
                logout,
                resetPassword,
                updatePassword,
                updateProfile,
                uploadAvatar,
                setIsAuthenticated,
                setIsRecoveryFlow,
                error,
                loading,
                isInitializing,
                isRecoveryFlow,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
