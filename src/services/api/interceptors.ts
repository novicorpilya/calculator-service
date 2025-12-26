import api from '@/services/api/axios'
import { supabase } from '@/services/supabase'

// Request interceptor - получает токен из Supabase сессии
api.interceptors.request.use(
  async (config) => {
    // Получаем токен из Supabase сессии (не из localStorage)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token && config.headers) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Response interceptor - обрабатывает 401 ошибки
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { response?: { status: number } }
    
    if (axiosError.response?.status === 401) {
      // Очищаем Supabase сессию при 401 ошибке
      await supabase.auth.signOut()
      
      // Редирект на страницу входа
      window.location.href = '/auth/login'
    }
    
    return Promise.reject(error)
  }
)

export default api
