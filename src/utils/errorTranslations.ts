/**
 * Переводит технические сообщения об ошибках от Supabase на русский язык
 */
export const translateAuthError = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('invalid login credentials')) {
        return 'Неверный email или пароль'
    }

    if (lowerMessage.includes('user already registered')) {
        return 'Пользователь с таким email уже зарегистрирован'
    }

    if (lowerMessage.includes('email not confirmed')) {
        return 'Пожалуйста, подтвердите ваш email перед входом'
    }

    if (lowerMessage.includes('rate limit exceeded')) {
        return 'Слишком много попыток входа. Пожалуйста, попробуйте позже'
    }

    if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
        return 'Ошибка сети. Проверьте подключение к интернету'
    }

    if (lowerMessage.includes('password should be at least')) {
        return 'Пароль слишком короткий'
    }

    if (lowerMessage.includes('user not found')) {
        return 'Пользователь не найден'
    }

    if (lowerMessage.includes('invalid email')) {
        return 'Некорректный формат email'
    }

    // Общее сообщение для остальных случаев, если нужно оставить оригинальный текст для отладки, 
    // можно вернуть message, но лучше дружелюбное сообщение
    return 'Произошла ошибка при аутентификации. Пожалуйста, попробуйте еще раз'
}
