

import { supabase } from '@/services/supabase'
import type { LoginCredentials, RegisterCredentials, User } from '@/features/auth/auth.types'

export interface AuthResponse {
  token: string
  user: User
}

// Auth service with Supabase
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.session) {
      throw new Error('No session returned from login')
    }

    // Fetch user profile from database
    const userProfile = await authService.getUserProfile(data.user.id)

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    return {
      token: data.session.access_token,
      user: userProfile,
    }
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  },

  register: async (
    credentials: RegisterCredentials
  ): Promise<AuthResponse> => {
    // Create auth user (profile is auto-created by database trigger)
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('User creation failed')
    }

    // Wait for trigger to create profile with retry logic
    type ProfileData = {
      id: string
      email: string
      role: string
      organization_name: string | null
      phone: string | null
      address: string | null
      created_at: string
      updated_at: string
    }

    let profile: ProfileData | null = null
    let attempts = 0
    const maxAttempts = 10
    const retryDelay = 200

    while (!profile && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', authData.user.id)
        .single()

      if (!error && data) {
        profile = data as ProfileData
        break
      }

      attempts++
    }

    if (!profile) {
      throw new Error('Failed to create user profile: timeout waiting for profile creation')
    }

    // Update profile with additional registration data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        organization_name: credentials.organizationName,
        phone: credentials.phone,
        address: credentials.address,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      throw new Error(`Failed to update user profile: ${updateError.message}`)
    }

    // Fetch updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select()
      .eq('id', authData.user.id)
      .single()

    if (fetchError || !updatedProfile) {
      throw new Error('Failed to fetch updated user profile')
    }

    // Return success - user needs to confirm email or can login directly
    // Note: token will be empty if email confirmation is required
    const session = authData.session
    return {
      token: session?.access_token || '',
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        role: updatedProfile.role,
        organizationName: updatedProfile.organization_name,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
      },
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return authService.getUserProfile(data.user.id)
  },

  getUserProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Return null if profile not found (user may have been deleted)
    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      organizationName: data.organization_name,
      phone: data.phone,
      address: data.address,
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session) {
      throw new Error(error?.message || 'Failed to refresh token')
    }

    return {
      token: data.session.access_token,
    }
  },
}
