/**
 * Переводит технические сообщения об ошибках от Supabase на русский язык
 */
export const translateAuthError = (message: any): string => {
    if (!message || typeof message !== 'string') {
        return 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.'
    }

    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
        return 'Неверный email или пароль'
    }

    if (lowerMessage.includes('user already registered')) {
        return 'Пользователь с таким email уже зарегистрирован'
    }

    if (lowerMessage.includes('email not confirmed')) {
        return 'Пожалуйста, подтвердите ваш email перед входом'
    }

    if (lowerMessage.includes('rate limit exceeded')) {
        return 'Слишком много попыток. Пожалуйста, подождите несколько минут'
    }

    if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
        return 'Ошибка сети. Проверьте подключение к интернету'
    }

    if (lowerMessage.includes('password should be') || lowerMessage.includes('weak password')) {
        return 'Пароль не соответствует требованиям безопасности'
    }

    if (lowerMessage.includes('different from the old password')) {
        return 'Новый пароль должен отличаться от старого'
    }

    if (lowerMessage.includes('user not found')) {
        return 'Пользователь с таким email не найден'
    }

    if (lowerMessage.includes('invalid email')) {
        return 'Введите корректный адрес электронной почты'
    }

    if (lowerMessage.includes('session') || lowerMessage.includes('token')) {
        return 'Срок действия ссылки истек. Пожалуйста, запросите восстановление заново.'
    }

    return 'Ошибка аутентификации. Попробуйте обновить страницу.'
}
