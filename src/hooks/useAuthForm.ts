

import { useState } from 'react'
import { useAuth } from '@/app/providers/useAuthHook'
import type { AuthFormState, RegisterFormData, LoginFormData } from '@/features/auth/auth.form.types'
import type { LoginCredentials, RegisterCredentials } from '@/features/auth/auth.types'
import { translateAuthError } from '@/utils/errorTranslations'

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  phone: '',
  address: '',
}

// Ключ для localStorage (только предпочтение галочки, НЕ чувствительные данные)
const REMEMBER_ME_PREFERENCE_KEY = 'remember_me_preference'

/**
 * Получает предпочтение пользователя "Запомнить меня"
 * При первом заходе (ключа нет) — возвращает true по умолчанию
 * Если пользователь снял галочку — возвращает false
 */
const getRememberMePreference = (): boolean => {
  try {
    const preference = localStorage.getItem(REMEMBER_ME_PREFERENCE_KEY)
    // Если ключа нет (первый заход) — по умолчанию true
    if (preference === null) {
      return true
    }
    // Иначе возвращаем сохранённое значение
    return preference === 'true'
  } catch {
    // При ошибке (например, localStorage недоступен) — по умолчанию true
    return true
  }
}

/**
 * Сохраняет предпочтение "Запомнить меня"
 */
const saveRememberMePreference = (value: boolean): void => {
  try {
    localStorage.setItem(REMEMBER_ME_PREFERENCE_KEY, String(value))
  } catch (error) {
    console.error('Failed to save remember me preference:', error)
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
  const { login: authLogin, register: authRegister, setIsAuthenticated } = useAuth()

  // Загружаем предпочтение галочки "Запомнить меня" при инициализации
  const rememberMePreference = getRememberMePreference()

  const [state, setState] = useState<AuthFormState>({
    mode: 'login',
    loading: false,
    formData: INITIAL_FORM_DATA,
    showPassword: false,
    rememberMe: rememberMePreference, // Загружаем сохранённое предпочтение
    agreeToTerms: true, // По умолчанию галочка установлена
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
    // Загружаем предпочтение галочки при переключении на логин
    const rememberMePreference = mode === 'login' ? getRememberMePreference() : state.rememberMe

    setState((prev) => ({
      ...prev,
      mode,
      formData: INITIAL_FORM_DATA,
      rememberMe: rememberMePreference, // Загружаем сохранённое предпочтение
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

    // Сохраняем предпочтение пользователя в localStorage
    saveRememberMePreference(checked)
  }

  const handleAgreeToTermsChange = (checked: boolean) => {
    setState((prev) => ({
      ...prev,
      agreeToTerms: checked,
    }))
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
    let { name, value } = e.target

    // Фильтрация для поля телефона: только цифры, +, -, (, ), пробел
    if (name === 'phone') {
      // Оставляем только разрешенные символы
      value = value.replace(/[^0-9+\-()\s]/g, '')
    }

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

      // Предпочтение галочки уже сохранено при изменении (handleRememberMeChange)
      // Сессия управляется Supabase автоматически

      setState((prev) => ({ ...prev, mode: 'success' }))
    } catch (err) {
      const originalMessage = err instanceof Error ? err.message : 'Ошибка входа'
      setError(translateAuthError(originalMessage))
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
      const originalMessage = err instanceof Error ? err.message : 'Ошибка регистрации'
      setError(translateAuthError(originalMessage))
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleContinue = () => {
    setIsAuthenticated(true)
  }

  const handleReset = () => {
    // Загружаем предпочтение галочки при сбросе
    const rememberMePreference = getRememberMePreference()
    setState({
      mode: 'login',
      loading: false,
      formData: INITIAL_FORM_DATA,
      showPassword: false,
      rememberMe: rememberMePreference,
      agreeToTerms: true,
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

  // Проверка валидности формы логина (для disabled кнопки)
  const isLoginFormValid = (): boolean => {
    const { email, password } = state.formData

    // Проверяем что поля заполнены
    if (!email.trim() || !password) {
      return false
    }

    // Проверяем валидность email
    const emailValidation = validateEmail(email.trim())
    if (!emailValidation.valid) {
      return false
    }

    // Для логина достаточно что пароль не пустой
    return true
  }

  // Проверка валидности формы регистрации (для disabled кнопки)
  const isRegisterFormValid = (): boolean => {
    const { email, password, confirmPassword, organizationName, phone, address } = state.formData

    // Проверяем согласие с условиями
    if (!state.agreeToTerms) {
      return false
    }

    // Проверяем что все поля заполнены
    if (!email.trim() || !password || !confirmPassword || !organizationName.trim() || !phone.trim() || !address.trim()) {
      return false
    }

    // Проверяем валидность email
    const emailValidation = validateEmail(email.trim())
    if (!emailValidation.valid) {
      return false
    }

    // Проверяем валидность пароля
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return false
    }

    // Проверяем совпадение паролей
    if (password !== confirmPassword) {
      return false
    }

    return true
  }

  return {
    ...state,
    error,
    isLoginFormValid: isLoginFormValid(),
    isRegisterFormValid: isRegisterFormValid(),
    handleModeChange,
    handleInputChange,
    handleBlur,
    handleTogglePassword,
    handleRememberMeChange,
    handleAgreeToTermsChange,
    handleLogin,
    handleRegister,
    handleContinue,
    handleReset,
  }
}
