import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
    password: z.string().min(1, 'Пароль обязателен'),
    rememberMe: z.boolean(),
})

export const registerSchema = z.object({
    organizationName: z.string().min(2, 'Название организации слишком короткое'),
    address: z.string().min(5, 'Введите полный адрес'),
    phone: z.string().min(10, 'Введите корректный номер телефона'),
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
    password: z.string()
        .min(8, 'Пароль должен быть не менее 8 символов')
        .regex(/[A-ZА-Я]/, 'Нужна хотя бы одна заглавная буква')
        .regex(/[a-zа-я]/, 'Нужна хотя бы одна строчная буква')
        .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Нужен спецсимвол'),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, 'Необходимо согласие'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
})

export const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Пароль должен быть не менее 8 символов')
        .regex(/[A-ZА-Я]/, 'Нужна хотя бы одна заглавная буква')
        .regex(/[a-zа-я]/, 'Нужна хотя бы одна строчная буква')
        .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Нужен спецсимвол'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
})
