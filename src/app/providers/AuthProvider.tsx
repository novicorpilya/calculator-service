import React from 'react'
import { supabase } from '@/services/supabase'
import { authService } from '@/features/auth/auth.service'
import type { User, LoginCredentials, RegisterCredentials } from '@/features/auth/auth.types'

export interface AuthContextType {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    login: (credentials: LoginCredentials) => Promise<void>
    register: (credentials: RegisterCredentials) => Promise<void>
    logout: () => Promise<void>
    setIsAuthenticated: (value: boolean) => void
    error: string | null
    loading: boolean
    isInitializing: boolean
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
    const [isInitializing, setIsInitializing] = React.useState(true) // Только для первого запуска

    // Initialize auth state on mount
    React.useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get current session from Supabase
                const { data } = await supabase.auth.getSession()
                if (data.session) {
                    setToken(data.session.access_token)
                    const userProfile = await authService.getCurrentUser()
                    if (userProfile) {
                        setUser(userProfile)
                        setIsAuthenticated(true)
                    } else {
                        // Profile doesn't exist, logout
                        await supabase.auth.signOut()
                        setToken(null)
                        setUser(null)
                        setIsAuthenticated(false)
                    }
                }
            } catch (err) {
                console.error('Failed to initialize auth:', err)
            } finally {
                setIsInitializing(false) // Инициализация завершена
            }
        }

        initializeAuth()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setToken(session.access_token)

                // Если это восстановление сессии при загрузке или обновление токена - 
                // устанавливаем авторизацию автоматически.
                // При SIGNED_IN (новый вход) мы ждем ручного подтверждения через SuccessScreen.
                if (event !== 'SIGNED_IN') {
                    setIsAuthenticated(true)
                }
            } else {
                setToken(null)
                setUser(null)
                setIsAuthenticated(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const login = async (credentials: LoginCredentials) => {
        setLoading(true)
        setError(null)
        try {
            const response = await authService.login(credentials)
            setToken(response.token)
            setUser(response.user)
            // Мы НЕ устанавливаем isAuthenticated здесь, 
            // чтобы LoginForm мог показать SuccessScreen.
            // ScreenSuccess вызовет completeAuth или мы сделаем это сами позже.
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
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
            // Мы НЕ устанавливаем isAuthenticated здесь, 
            // чтобы показать SuccessScreen
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed'
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
            setError(null)
            setLoading(false)
        }
    }

    const value: AuthContextType = {
        isAuthenticated,
        user,
        token,
        login,
        register,
        logout,
        setIsAuthenticated,
        error,
        loading,
        isInitializing,
    }

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}

// Export context for use in hook
export { AuthContext }
