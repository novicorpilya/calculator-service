// Auth types
export interface User {
  id: string
  email: string
  role: 'client' | 'manager' | 'admin'
  organizationName?: string
  phone?: string
  address?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string
  organizationName: string
  phone: string
  address: string
}

export interface AuthError {
  message: string
  code?: string
  field?: string
}
