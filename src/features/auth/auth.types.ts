// Auth types matching our Middle+ Form requirements

export interface User {
  id: string
  email: string
  role: 'client' | 'manager' | 'admin'
  organizationName?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  status?: 'active' | 'blocked'
  createdAt?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials extends LoginCredentials {
  organizationName?: string
  firstName?: string
  lastName?: string
  phone: string
  address?: string
  agreeToTerms?: boolean
  confirmPassword: string
  inviteToken?: string
}

export interface AuthError {
  message: string
  code?: string
  field?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface UpdateProfileData {
  organizationName?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
}
