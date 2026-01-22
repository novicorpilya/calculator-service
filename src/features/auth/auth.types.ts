import { z } from 'zod';
import { userSchema } from './auth.validation';
import type { ActionResult } from '@/core/types/results';

export type User = z.infer<typeof userSchema>;

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterCredentials extends LoginCredentials {
    organizationName?: string;
    inn?: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    address?: string;
    agreeToTerms?: boolean;
    confirmPassword: string;
    inviteToken?: string;
}

export interface AuthError {
    message: string;
    code?: string;
    field?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface UpdateProfileData {
    organizationName?: string;
    inn?: string;
    jobTitle?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string | null;
}

export type { ActionResult };
export type AuthVoidResult = ActionResult<void>;
