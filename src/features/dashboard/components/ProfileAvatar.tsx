import React, { useRef, useState } from 'react';
import { Camera, Trash2, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileAvatarProps {
    avatarUrl?: string | null;
    onUpdate: (url: string | null) => Promise<void>;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, onUpdate }) => {
    const { uploadAvatar } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите изображение');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Размер файла не должен превышать 5МБ');
            return;
        }

        try {
            setUploading(true);
            const res = await uploadAvatar(file);
            if (!res.success || !res.data) {
                toast.error(res.error?.message || 'Ошибка загрузки');
                return;
            }
            await onUpdate(res.data);
        } catch {
            toast.error('Произошла ошибка при загрузке');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить фото профиля?')) return;
        
        try {
            setUploading(true);
            await onUpdate(null);
            toast.success('Фото профиля удалено');
        } catch {
            toast.error('Ошибка при удалении фото');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-10 mb-16 px-4">
            <div className="relative group/avatar">
                {/* Outer Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-primary/5 to-indigo-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700 -z-10" />
                
                {/* Avatar Container */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[2.5rem] p-1 bg-gradient-to-br from-border-theme via-border-theme/40 to-primary/30 shadow-2xl relative overflow-hidden transition-transform duration-500 group-hover/avatar:scale-[1.02]">
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-card/60 backdrop-blur-xl flex items-center justify-center relative">
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover transition-all duration-700 group-hover/avatar:scale-110"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <UserIcon className="w-14 h-14 sm:w-16 sm:h-16 text-primary/10 transition-transform duration-500 group-hover/avatar:scale-110" />
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-[0.3em] opacity-0 group-hover/avatar:opacity-100 transition-opacity">No Avatar</span>
                            </div>
                        )}
                        
                        {/* Status Overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-background/40 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
                                <div className="relative">
                                    <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Corner Indicator */}
                {!avatarUrl && !uploading && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-background animate-bounce-subtle">
                        <Camera size={14} />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="relative px-10 py-4 overflow-hidden rounded-2xl group/btn disabled:opacity-50 transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-primary opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3 text-white text-[11px] font-black uppercase tracking-[0.2em]">
                        <Camera size={18} className="transition-transform duration-500 group-hover/btn:rotate-12 group-hover/btn:scale-110" />
                        <span>Выбрать фото</span>
                    </div>
                </button>

                {avatarUrl && (
                    <button
                        onClick={handleDelete}
                        disabled={uploading}
                        className="relative px-10 py-4 overflow-hidden rounded-2xl group/del disabled:opacity-50 transition-all active:scale-95 border border-border-theme bg-card/40 backdrop-blur-md hover:border-red-500/50"
                    >
                        <div className="absolute inset-0 bg-red-500 opacity-0 group-hover/del:opacity-5 transition-opacity" />
                        <div className="relative flex items-center gap-3 text-red-500 text-[11px] font-black uppercase tracking-[0.2em]">
                            <Trash2 size={18} className="transition-all duration-500 group-hover/del:translate-y-[-2px] group-hover/del:scale-110" />
                            <span>Удалить</span>
                        </div>
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};
