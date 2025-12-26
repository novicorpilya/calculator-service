// filepath: src/features/auth/auth.form.types.ts

export type AuthMode = 'login' | 'register' | 'success'

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  organizationName: string
  phone: string
  address: string
}

export type AuthFormData = LoginFormData | RegisterFormData

export interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
  organizationName?: string
  phone?: string
  address?: string
}

export interface AuthFormState {
  mode: AuthMode
  loading: boolean
  formData: RegisterFormData
  showPassword: boolean
  rememberMe: boolean
  fieldErrors: FieldErrors
  touched: {
    email: boolean
    password: boolean
    confirmPassword: boolean
    organizationName: boolean
    phone: boolean
    address: boolean
  }
}
