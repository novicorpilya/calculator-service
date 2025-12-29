import { supabase } from '@/services/supabase'
import { authStorage } from '@/services/supabase/storage'
import type { LoginCredentials, RegisterCredentials, User } from '@/features/auth/auth.types'

export interface AuthResponse {
  token: string
  user: User
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Сессия не создана')

    const userProfile = await authService.getUserProfile(data.user.id)
    if (!userProfile) throw new Error('Профиль не найден')

    return {
      token: data.session.access_token,
      user: userProfile,
    }
  },

  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
    } finally {
      // Гарантированная очистка всех хранилищ
      authStorage.clearAll()
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Ошибка создания user')

    let profile = await authService.getUserProfileWithRetry(authData.user.id)
    if (!profile) throw new Error('Таймаут профиля')

    await supabase.from('profiles').update({
      organization_name: credentials.organizationName,
      phone: credentials.phone,
      address: credentials.address,
    }).eq('id', authData.user.id)

    const updatedProfile = await authService.getUserProfile(authData.user.id)
    if (!updatedProfile) throw new Error('Ошибка получения профиля')

    return {
      token: authData.session?.access_token || '',
      user: updatedProfile,
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null
    return authService.getUserProfile(data.user.id)
  },

  getUserProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error || !data) return null
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      organizationName: data.organization_name,
      phone: data.phone,
      address: data.address,
    }
  },

  getUserProfileWithRetry: async (userId: string): Promise<User | null> => {
    for (let i = 0; i < 10; i++) {
      const p = await authService.getUserProfile(userId)
      if (p) return p
      await new Promise(r => setTimeout(r, 200))
    }
    return null
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
  },

  updatePassword: async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
}
