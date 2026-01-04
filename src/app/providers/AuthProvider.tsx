import React from 'react'
import { supabase } from '@/services/supabase'
import { authService } from '@/features/auth/auth.service'
import type { User, LoginCredentials, RegisterCredentials, UpdateProfileData } from '@/features/auth/auth.types'

export interface AuthContextType {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    login: (credentials: LoginCredentials) => Promise<void>
    register: (credentials: RegisterCredentials) => Promise<void>
    logout: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    updateProfile: (updates: UpdateProfileData) => Promise<void>
    setIsAuthenticated: (value: boolean) => void
    setIsRecoveryFlow: (value: boolean) => void
    error: string | null
    loading: boolean
    isInitializing: boolean
    isRecoveryFlow: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [user, setUser] = React.useState<User | null>(null)
    const [token, setToken] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [isInitializing, setIsInitializing] = React.useState(true)
    const [isRecoveryFlow, setIsRecoveryFlow] = React.useState(false)

    React.useEffect(() => {
        let isMounted = true;
        let profileSubscription: any = null;

        const checkRecovery = () => {
            return window.location.hash.includes('type=recovery') ||
                window.location.search.includes('type=recovery') ||
                window.location.hash.includes('access_token');
        };

        const init = async () => {
            try {
                if (checkRecovery()) setIsRecoveryFlow(true);
                const { data: { session } } = await supabase.auth.getSession()

                if (session && isMounted) {
                    setToken(session.access_token)
                    const userProfile = await authService.getCurrentUser()

                    if (userProfile && isMounted) {
                        if (userProfile.status === 'blocked') {
                            await logout();
                            return;
                        }
                        setUser(userProfile)
                        if (!checkRecovery()) setIsAuthenticated(true)
                        setupProfileListener(userProfile.id);
                    } else if (isMounted) {
                        // Profile not found - likely deleted
                        await logout();
                    }
                }
            } catch {
                // Молчаливая обработка ошибок инициализации
            } finally {
                if (isMounted) setIsInitializing(false)
            }
        };

        const setupProfileListener = (userId: string) => {
            if (profileSubscription) profileSubscription.unsubscribe();

            profileSubscription = supabase
                .channel(`public:profiles:id=eq.${userId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`
                }, (payload) => {
                    if (!isMounted) return;

                    // IF DELETED
                    if (payload.eventType === 'DELETE') {
                        logout();
                        return;
                    }

                    // IF BLOCKED
                    const newProfile = payload.new as User;
                    if (newProfile && newProfile.status === 'blocked') {
                        logout();
                    } else if (newProfile) {
                        setUser(prev => prev ? { ...prev, ...newProfile } : newProfile);
                    }
                })
                .subscribe();
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            if (session) {
                setToken(session.access_token)
                if (event === 'PASSWORD_RECOVERY') setIsRecoveryFlow(true)

                if (session.user) {
                    authService.getUserProfile(session.user.id).then(profile => {
                        if (profile && isMounted) {
                            if (profile.status === 'blocked') {
                                logout();
                                return;
                            }
                            setUser(profile);
                            setupProfileListener(profile.id);
                        } else if (isMounted) {
                            logout();
                        }
                    }).catch(() => {
                        // Молчаливая обработка фонового обновления
                    });
                }
            } else {
                if (event === 'SIGNED_OUT') {
                    setToken(null)
                    setUser(null)
                    setIsAuthenticated(false)
                    setIsRecoveryFlow(false)
                    if (profileSubscription) profileSubscription.unsubscribe();
                }
            }
        })

        init();

        return () => {
            isMounted = false;
            subscription.unsubscribe()
            if (profileSubscription) profileSubscription.unsubscribe();
        }
    }, [])

    const login = async (credentials: LoginCredentials) => {
        setLoading(true)
        setError(null)
        try {
            const response = await authService.login(credentials)
            setToken(response.token)
            setUser(response.user)
            setIsAuthenticated(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const register = async (credentials: RegisterCredentials) => {
        setLoading(true)
        setError(null)
        try {
            const response = await authService.register(credentials)
            setToken(response.token)
            setUser(response.user)
            setIsAuthenticated(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const resetPassword = async (email: string) => {
        setLoading(true)
        setError(null)
        try {
            await authService.resetPassword(email)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const updatePassword = async (password: string) => {
        setError(null)
        await authService.updatePassword(password)
    }

    const updateProfile = async (updates: UpdateProfileData) => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const updatedUser = await authService.updateProfile(user.id, updates)
            if (updatedUser) setUser(updatedUser)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await authService.logout()
        } finally {
            setToken(null)
            setUser(null)
            setIsAuthenticated(false)
            setIsRecoveryFlow(false)
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            token,
            login,
            register,
            logout,
            resetPassword,
            updatePassword,
            updateProfile,
            setIsAuthenticated,
            setIsRecoveryFlow,
            error,
            loading,
            isInitializing,
            isRecoveryFlow
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext }
