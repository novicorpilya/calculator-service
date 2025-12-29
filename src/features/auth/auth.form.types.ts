import { z } from 'zod'
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation'

export type AuthMode = 'login' | 'register' | 'success-login' | 'success-register' | 'forgot-password' | 'reset-password' | 'reset-success' | 'forgot-success'

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export interface AuthFormState {
  loading: boolean
  showPassword: boolean
  serverError: string | null
}
