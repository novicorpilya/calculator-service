import { supabase } from '@/services/supabase'
import { authStorage } from '@/services/supabase/storage'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  UpdateProfileData
} from './auth.types'

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Ошибка входа')

    const profile = await authService.getUserProfile(authData.user.id)
    if (!profile) throw new Error('Профиль не найден')

    return {
      token: authData.session?.access_token || '',
      user: profile,
    }
  },

  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
    } finally {
      authStorage.clearAll()
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    let role: 'client' | 'manager' | 'admin' = 'client'
    let inviteId: string | null = null

    // Проверка приглашения
    if (credentials.inviteToken) {
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', credentials.inviteToken)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError || !invite) {
        throw new Error('Приглашение недействительно или просрочено')
      }

      role = invite.role as 'client' | 'manager' | 'admin'
      inviteId = invite.id
    }

    // Регистрация в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Ошибка создания пользователя')

    // Ожидание создания профиля (триггером в БД)
    const profile = await authService.getUserProfileWithRetry(authData.user.id)
    if (!profile) throw new Error('Таймаут создания профиля. Попробуйте войти.')

    // Обновление профиля данными из формы и ролью
    await supabase.from('profiles').update({
      organization_name: credentials.organizationName,
      phone: credentials.phone,
      address: credentials.address,
      role: role
    }).eq('id', authData.user.id)

    // Если был инвайт - гасим его через безопасный RPC
    if (inviteId) {
      await supabase.rpc('accept_invitation_v2', {
        invite_id_param: inviteId,
        user_id_param: authData.user.id
      })
    }

    const updatedProfile = await authService.getUserProfile(authData.user.id)
    if (!updatedProfile) throw new Error('Ошибка получения данных профиля')

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

  getInvitationByToken: async (token: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .select('email, role')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error) return null
    return data
  },

  getUserProfile: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) return null
    return data as User
  },

  getUserProfileWithRetry: async (id: string, retries = 5): Promise<User | null> => {
    for (let i = 0; i < retries; i++) {
      const profile = await authService.getUserProfile(id)
      if (profile) return profile
      await new Promise(r => setTimeout(r, 1000))
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
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(error.message)
  },

  updateProfile: async (userId: string, data: UpdateProfileData): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({
        organization_name: data.organizationName,
        phone: data.phone,
        address: data.address,
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    const profile = await authService.getUserProfile(userId)
    if (!profile) throw new Error('Ошибка получения профиля')
    return profile
  }
}
