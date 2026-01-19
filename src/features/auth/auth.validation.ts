import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
    password: z.string().min(1, 'Пароль обязателен'),
    rememberMe: z.boolean(),
});

export const registerSchema = z
    .object({
        organizationName: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().min(10, 'Введите корректный номер телефона'),
        email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
        password: z
            .string()
            .min(8, 'Пароль должен быть не менее 8 символов')
            .regex(/[A-ZА-Я]/, 'Нужна хотя бы одна заглавная буква')
            .regex(/[a-zа-я]/, 'Нужна хотя бы одна строчная буква')
            .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
            .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Нужен спецсимвол'),
        confirmPassword: z.string(),
        agreeToTerms: z.boolean().refine((val) => val === true, 'Необходимо согласие'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
});

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Пароль должен быть не менее 8 символов')
            .regex(/[A-ZА-Я]/, 'Нужна хотя бы одна заглавная буква')
            .regex(/[a-zа-я]/, 'Нужна хотя бы одна строчная буква')
            .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
            .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Нужен спецсимвол'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export const userSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['client', 'manager', 'admin']),
    organizationName: z.string().optional().nullable(),
    inn: z
        .string()
        .regex(/^\d*$/, 'Только цифры')
        .refine((val) => !val || val.length === 10 || val.length === 12, 'ИНН должен быть 10 или 12 цифр')
        .optional()
        .nullable(),
    jobTitle: z
        .string()
        .regex(/^[^0-9]*$/, 'Цифры запрещены')
        .optional()
        .nullable(),
    firstName: z
        .string()
        .regex(/^[^0-9]*$/, 'Цифры запрещены')
        .optional()
        .nullable(),
    lastName: z
        .string()
        .regex(/^[^0-9]*$/, 'Цифры запрещены')
        .optional()
        .nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    status: z.enum(['active', 'blocked']).default('active'),
    createdAt: z.string(),
});

export const dbProfileSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['client', 'manager', 'admin']),
    organization_name: z.string().optional().nullable(),
    inn: z.string().optional().nullable(),
    job_title: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    status: z.enum(['active', 'blocked']).default('active'),
    created_at: z.string(),
});
