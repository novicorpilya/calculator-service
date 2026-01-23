import { supabase } from '@/services/supabase';
import { authStorage } from '@/services/supabase/storage';
import { logger } from '@/core/logging';
import type {
    AuthResponse,
    LoginCredentials,
    RegisterCredentials,
    User,
    UpdateProfileData,
    ActionResult,
    AuthVoidResult,
} from './auth.types';
import { dbProfileSchema } from './auth.validation';

import { wrapError } from '@/core/utils/errors';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<ActionResult<AuthResponse>> => {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (authError) return { success: false, error: { message: authError.message } };
            if (!authData.user) return { success: false, error: { message: 'Ошибка входа' } };

            const profileRes = await authService.getUserProfile(authData.user.id);
            if (!profileRes.success || !profileRes.data) {
                return {
                    success: false,
                    error: { message: profileRes.error?.message || 'Профиль не найден' },
                };
            }

            return {
                success: true,
                data: {
                    token: authData.session?.access_token || '',
                    user: profileRes.data,
                },
            };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    logout: async (): Promise<AuthVoidResult> => {
        try {
            const { error } = await supabase.auth.signOut();
            authStorage.clearAll();
            if (error) return { success: false, error: { message: error.message } };
            return { success: true, data: undefined };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    register: async (credentials: RegisterCredentials): Promise<ActionResult<AuthResponse>> => {
        try {
            let role: 'client' | 'manager' | 'admin' = 'client';
            let inviteId: string | null = null;

            // Проверка приглашения
            if (credentials.inviteToken) {
                const { data: invite, error: inviteError } = await supabase
                    .from('invitations')
                    .select('*')
                    .eq('token', credentials.inviteToken)
                    .eq('status', 'pending')
                    .gt('expires_at', new Date().toISOString())
                    .single();

                if (inviteError || !invite) {
                    return {
                        success: false,
                        error: { message: 'Приглашение недействительно или просрочено' },
                    };
                }

                role = invite.role as 'client' | 'manager' | 'admin';
                inviteId = invite.id;
            }

            // Регистрация в Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: credentials.email,
                password: credentials.password,
                options: {
                    data: {
                        first_name: credentials.firstName,
                        organization_name: credentials.organizationName,
                        role: role,
                    },
                },
            });

            if (authError) return { success: false, error: { message: authError.message } };
            if (!authData.user)
                return { success: false, error: { message: 'Ошибка создания пользователя' } };

            // Если email confirmation включен - сессии не будет
            if (!authData.session) {
                return {
                    success: true,
                    data: {
                        token: '',
                        user: {
                            id: authData.user.id,
                            email: authData.user.email || credentials.email,
                            role: role,
                            organizationName: credentials.organizationName,
                            firstName: credentials.firstName,
                            lastName: credentials.lastName,
                            phone: credentials.phone,
                            address: credentials.address,
                            status: 'active',
                            createdAt: new Date().toISOString(),
                        },
                    },
                };
            }

            const profileRes = await authService.getUserProfileWithRetry(authData.user.id);
            if (!profileRes.success || !profileRes.data) {
                return {
                    success: false,
                    error: {
                        message:
                            profileRes.error?.message ||
                            'Таймаут создания профиля. Попробуйте войти.',
                    },
                };
            }

            // Обновление профиля данными из формы
            const { error: upError } = await supabase
                .from('profiles')
                .update({
                    organization_name: credentials.organizationName,
                    inn: credentials.inn,
                    first_name: credentials.firstName,
                    last_name: credentials.lastName,
                    phone: credentials.phone,
                    address: credentials.address,
                    role: role,
                })
                .eq('id', authData.user.id);

            if (upError) return { success: false, error: { message: upError.message } };

            if (inviteId) {
                await supabase.rpc('accept_invitation_v2', {
                    invite_id_param: inviteId,
                    user_id_param: authData.user.id,
                });
            }

            const updatedProfileRes = await authService.getUserProfile(authData.user.id);
            if (!updatedProfileRes.success || !updatedProfileRes.data) {
                return { success: false, error: { message: 'Ошибка получения данных профиля' } };
            }

            return {
                success: true,
                data: {
                    token: authData.session?.access_token || '',
                    user: updatedProfileRes.data,
                },
            };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    getCurrentUser: async (): Promise<ActionResult<User | null>> => {
        try {
            const { data } = await supabase.auth.getUser();
            if (!data.user) return { success: true, data: null };
            return authService.getUserProfile(data.user.id);
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    getInvitationByToken: async (
        token: string
    ): Promise<ActionResult<{ email: string; role: string } | null>> => {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .select('email, role')
                .eq('token', token)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();

            if (error) return { success: false, error: { message: error.message } };
            return { success: true, data };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    getUserProfile: async (id: string): Promise<ActionResult<User | null>> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) return { success: false, error: { message: error.message } };
            if (!data) return { success: true, data: null };

            const parsed = dbProfileSchema.safeParse(data);
            if (!parsed.success) {
                logger.error('Failed to parse profile from DB', { error: parsed.error });
                return { success: false, error: { message: 'Data corruption in profile' } };
            }

            const {
                organization_name,
                inn,
                job_title,
                first_name,
                last_name,
                avatar_url,
                created_at,
                ...other
            } = parsed.data;

            return {
                success: true,
                data: {
                    ...other,
                    organizationName: organization_name || undefined,
                    inn: inn || undefined,
                    jobTitle: job_title || undefined,
                    firstName: first_name || undefined,
                    lastName: last_name || undefined,
                    avatarUrl: avatar_url || undefined,
                    createdAt: created_at,
                },
            };
        } catch (e) {
            logger.error('Error in getUserProfile', { error: e, userId: id });
            return { success: false, error: wrapError(e) };
        }
    },

    getUserProfileWithRetry: async (
        id: string,
        retries = 3
    ): Promise<ActionResult<User | null>> => {
        for (let i = 0; i < retries; i++) {
            const res = await authService.getUserProfile(id);
            if (res.success && res.data) return res;
            await new Promise((r) => setTimeout(r, 2000));
        }
        return { success: false, error: { message: 'Profile initialization timeout' } };
    },

    resetPassword: async (email: string): Promise<AuthVoidResult> => {
        try {
            // 1. Сначала проверяем, существует ли такой пользователь
            // Используем таблицу profiles, так как к ней у нас есть доступ
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (!profile) {
                // Пользователь не найден - явно сообщаем об этом
                return {
                    success: false,
                    error: { message: 'Пользователь с таким email не найден' },
                };
            }

            // 2. Если пользователь есть, отправляем сброс
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                // Обработка лимита
                if (error.message.includes('rate limit')) {
                    return {
                        success: false,
                        error: { message: 'Слишком много попыток. Подождите минуту.' },
                    };
                }
                return { success: false, error: { message: error.message } };
            }
            return { success: true, data: undefined };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    updatePassword: async (password: string): Promise<AuthVoidResult> => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) return { success: false, error: { message: error.message } };
            return { success: true, data: undefined };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    updateProfile: async (userId: string, data: UpdateProfileData): Promise<ActionResult<User>> => {
        try {
            const updateObj: Record<string, string | null | undefined> = {};
            if (data.organizationName !== undefined)
                updateObj.organization_name = data.organizationName;
            if (data.inn !== undefined) updateObj.inn = data.inn;
            if (data.jobTitle !== undefined) updateObj.job_title = data.jobTitle;
            if (data.firstName !== undefined) updateObj.first_name = data.firstName;
            if (data.lastName !== undefined) updateObj.last_name = data.lastName;
            if (data.phone !== undefined) updateObj.phone = data.phone;
            if (data.address !== undefined) updateObj.address = data.address;
            if (data.avatarUrl !== undefined) updateObj.avatar_url = data.avatarUrl;

            const { error } = await supabase.from('profiles').update(updateObj).eq('id', userId);

            if (error) return { success: false, error: { message: error.message } };
            const res = await authService.getUserProfile(userId);
            if (!res.success || !res.data)
                return {
                    success: false,
                    error: { message: res.error?.message || 'Ошибка получения профиля' },
                };
            return { success: true, data: res.data };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },

    uploadAvatar: async (userId: string, file: File): Promise<ActionResult<string>> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
            const filePath = `chat/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) return { success: false, error: { message: uploadError.message } };

            const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);

            return { success: true, data: data.publicUrl };
        } catch (err) {
            return { success: false, error: wrapError(err) };
        }
    },
};
