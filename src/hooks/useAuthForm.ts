// filepath: src/hooks/useAuthForm.ts

import { useState } from 'react'
import { useAuth } from '@/app/providers/useAuthHook'
import type { AuthFormState, RegisterFormData, LoginFormData } from '@/features/auth/auth.form.types'
import type { LoginCredentials, RegisterCredentials } from '@/features/auth/auth.types'

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  phone: '',
  address: '',
}

// Ключи для localStorage
const REMEMBERED_EMAIL_KEY = 'remembered_email'
const REMEMBERED_PASSWORD_KEY = 'remembered_password'

// Функции для работы с сохраненными данными
const loadRememberedCredentials = (): { email: string; password: string } => {
  try {
    const email = localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''
    const password = localStorage.getItem(REMEMBERED_PASSWORD_KEY) || ''
    return { email, password }
  } catch {
    return { email: '', password: '' }
  }
}

const saveRememberedCredentials = (email: string, password: string): void => {
  try {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    localStorage.setItem(REMEMBERED_PASSWORD_KEY, password)
  } catch (error) {
    console.error('Failed to save remembered credentials:', error)
  }
}

const clearRememberedCredentials = (): void => {
  try {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    localStorage.removeItem(REMEMBERED_PASSWORD_KEY)
  } catch (error) {
    console.error('Failed to clear remembered credentials:', error)
  }
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password validation
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен содержать минимум 8 символов' }
  }
  
  if (!/[A-ZА-Я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' }
  }
  
  if (!/[a-zа-я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну строчную букву' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' }
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и т.д.)' }
  }
  
  return { valid: true }
}

// Email validation
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email обязателен для заполнения' }
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Введите корректный email адрес' }
  }
  
  return { valid: true }
}

export const useAuthForm = () => {
  const { login: authLogin, register: authRegister } = useAuth()
  
  // Загружаем сохраненные данные при инициализации
  const rememberedCredentials = loadRememberedCredentials()
  const initialFormData: RegisterFormData = {
    ...INITIAL_FORM_DATA,
    email: rememberedCredentials.email,
    password: rememberedCredentials.password,
  }
  
  const [state, setState] = useState<AuthFormState>({
    mode: 'login',
    loading: false,
    formData: initialFormData,
    showPassword: false,
    rememberMe: true, // По умолчанию активна
    fieldErrors: {},
    touched: {
      email: false,
      password: false,
      confirmPassword: false,
      organizationName: false,
      phone: false,
      address: false,
    },
  })
  const [error, setError] = useState<string | null>(null)

  const handleModeChange = (mode: 'login' | 'register') => {
    // При переключении на логин загружаем сохраненные данные
    const rememberedCredentials = loadRememberedCredentials()
    const formDataForMode = mode === 'login' 
      ? {
          ...INITIAL_FORM_DATA,
          email: rememberedCredentials.email,
          password: rememberedCredentials.password,
        }
      : INITIAL_FORM_DATA
    
    setState((prev) => ({
      ...prev,
      mode,
      formData: formDataForMode,
      rememberMe: mode === 'login' ? true : prev.rememberMe, // При логине по умолчанию true
      fieldErrors: {},
      touched: {
        email: false,
        password: false,
        confirmPassword: false,
        organizationName: false,
        phone: false,
        address: false,
      },
    }))
    setError(null)
  }

  const handleRememberMeChange = (checked: boolean) => {
    setState((prev) => ({
      ...prev,
      rememberMe: checked,
    }))
    
    // Если убрали галочку, очищаем сохраненные данные
    if (!checked) {
      clearRememberedCredentials()
    }
  }

  // Validate single field
  const validateField = (name: string, value: string, currentPassword?: string): string | undefined => {
    if (name === 'email') {
      if (!value.trim()) {
        return 'Заполните поле'
      }
      const emailValidation = validateEmail(value.trim())
      if (!emailValidation.valid) {
        return emailValidation.error
      }
    }
    
    if (name === 'password') {
      if (!value) {
        return 'Заполните поле'
      }
      // Для логина не нужна сложная валидация пароля
      if (state.mode === 'register') {
        const passwordValidation = validatePassword(value)
        if (!passwordValidation.valid) {
          return passwordValidation.error
        }
      }
    }
    
    if (name === 'confirmPassword') {
      if (!value) {
        return 'Заполните поле'
      }
      // Используем переданный currentPassword или значение из state
      const passwordToCompare = currentPassword !== undefined ? currentPassword : state.formData.password
      if (value !== passwordToCompare) {
        return 'Пароли не совпадают'
      }
    }
    
    if (name === 'organizationName' || name === 'phone' || name === 'address') {
      if (!value.trim()) {
        return 'Заполните поле'
      }
    }
    
    return undefined
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setState((prev) => {
      const newFormData = {
        ...prev.formData,
        [name]: value,
      }
      
      // Обновляем ошибки для измененного поля
      const newFieldErrors: Record<string, string | undefined> = {
        ...prev.fieldErrors,
      }
      
      // Если поле было touched, валидируем его
      if (prev.touched[name as keyof typeof prev.touched]) {
        newFieldErrors[name] = validateField(name, value)
      }
      
      // Если изменился password и confirmPassword был touched, перевалидируем confirmPassword
      if (name === 'password' && prev.touched.confirmPassword) {
        newFieldErrors.confirmPassword = validateField('confirmPassword', prev.formData.confirmPassword, value)
      }
      
      // Если изменился confirmPassword и password был touched, перевалидируем confirmPassword
      if (name === 'confirmPassword' && prev.touched.password) {
        newFieldErrors.confirmPassword = validateField('confirmPassword', value, prev.formData.password)
      }
      
      return {
        ...prev,
        formData: newFormData,
        fieldErrors: newFieldErrors,
      }
    })
    setError(null)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Помечаем поле как touched
    setState((prev) => {
      const newFieldErrors: Record<string, string | undefined> = {
        ...prev.fieldErrors,
        [name]: validateField(name, value),
      }
      
      // Если потеряли фокус на password и confirmPassword был touched, перевалидируем confirmPassword
      if (name === 'password' && prev.touched.confirmPassword) {
        newFieldErrors.confirmPassword = validateField('confirmPassword', prev.formData.confirmPassword, value)
      }
      
      // Если потеряли фокус на confirmPassword и password был touched, перевалидируем confirmPassword
      if (name === 'confirmPassword' && prev.touched.password) {
        newFieldErrors.confirmPassword = validateField('confirmPassword', value, prev.formData.password)
      }
      
      return {
        ...prev,
        touched: {
          ...prev.touched,
          [name]: true,
        },
        // Валидируем поле при потере фокуса
        fieldErrors: newFieldErrors,
      }
    })
  }

  const handleTogglePassword = () => {
    setState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }))
  }

  const handleLogin = async () => {
    const loginData: LoginFormData = {
      email: state.formData.email.trim(),
      password: state.formData.password,
    }

    // Помечаем все поля как touched и валидируем
    const fieldErrors: Record<string, string | undefined> = {}
    let hasErrors = false

    // Валидация email
    const emailError = validateField('email', loginData.email)
    if (emailError) {
      fieldErrors.email = emailError
      hasErrors = true
    }

    // Валидация password
    const passwordError = validateField('password', loginData.password)
    if (passwordError) {
      fieldErrors.password = passwordError
      hasErrors = true
    }

    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        email: true,
        password: true,
      },
      fieldErrors: {
        ...prev.fieldErrors,
        ...fieldErrors,
      },
    }))

    if (hasErrors) {
      return
    }

    setState((prev) => ({ ...prev, loading: true }))
    setError(null)

    try {
      await authLogin(loginData as LoginCredentials)
      
      // Сохраняем данные если rememberMe активен
      if (state.rememberMe) {
        saveRememberedCredentials(loginData.email, loginData.password)
      } else {
        clearRememberedCredentials()
      }
      
      setState((prev) => ({ ...prev, mode: 'success' }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа'
      setError(message)
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleRegister = async () => {
    const registerData: RegisterFormData = {
      email: state.formData.email.trim(),
      password: state.formData.password,
      confirmPassword: state.formData.confirmPassword,
      organizationName: state.formData.organizationName.trim(),
      phone: state.formData.phone.trim(),
      address: state.formData.address.trim(),
    }

    // Помечаем все поля как touched и валидируем
    const fieldErrors: Record<string, string | undefined> = {}
    let hasErrors = false

    // Валидация всех полей
    const organizationNameError = validateField('organizationName', registerData.organizationName)
    if (organizationNameError) {
      fieldErrors.organizationName = organizationNameError
      hasErrors = true
    }

    const addressError = validateField('address', registerData.address)
    if (addressError) {
      fieldErrors.address = addressError
      hasErrors = true
    }

    const phoneError = validateField('phone', registerData.phone)
    if (phoneError) {
      fieldErrors.phone = phoneError
      hasErrors = true
    }

    const emailError = validateField('email', registerData.email)
    if (emailError) {
      fieldErrors.email = emailError
      hasErrors = true
    }

    const passwordError = validateField('password', registerData.password)
    if (passwordError) {
      fieldErrors.password = passwordError
      hasErrors = true
    }

    const confirmPasswordError = validateField('confirmPassword', registerData.confirmPassword)
    if (confirmPasswordError) {
      fieldErrors.confirmPassword = confirmPasswordError
      hasErrors = true
    }

    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        organizationName: true,
        address: true,
        phone: true,
        email: true,
        password: true,
        confirmPassword: true,
      },
      fieldErrors: {
        ...prev.fieldErrors,
        ...fieldErrors,
      },
    }))

    if (hasErrors) {
      return
    }

    setState((prev) => ({ ...prev, loading: true }))
    setError(null)

    try {
      await authRegister(registerData as RegisterCredentials)
      setState((prev) => ({ ...prev, mode: 'success' }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации'
      setError(message)
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleReset = () => {
    // Загружаем сохраненные данные при сбросе
    const rememberedCredentials = loadRememberedCredentials()
    setState({
      mode: 'login',
      loading: false,
      formData: {
        ...INITIAL_FORM_DATA,
        email: rememberedCredentials.email,
        password: rememberedCredentials.password,
      },
      showPassword: false,
      rememberMe: true,
      fieldErrors: {},
      touched: {
        email: false,
        password: false,
        confirmPassword: false,
        organizationName: false,
        phone: false,
        address: false,
      },
    })
    setError(null)
  }

  return {
    ...state,
    error,
    handleModeChange,
    handleInputChange,
    handleBlur,
    handleTogglePassword,
    handleRememberMeChange,
    handleLogin,
    handleRegister,
    handleReset,
  }
}
