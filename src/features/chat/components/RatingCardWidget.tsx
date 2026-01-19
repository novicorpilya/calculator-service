import React, { useState } from 'react';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { useServices } from '@/app/di/ServiceContainer';
import { toast } from 'sonner';

interface RatingCardWidgetProps {
    calculationId: string;
    userId: string;
    title?: string;
    subtitle?: string;
    isOwn: boolean;
    initialRating?: number;
    initialComment?: string;
}

export const RatingCardWidget: React.FC<RatingCardWidgetProps> = ({
    calculationId,
    userId,
    title = 'Заказ завершен!',
    subtitle = 'Будем рады вашей оценке',
    isOwn,
    initialRating = 0,
}) => {
    const { reviewService } = useServices();
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(initialRating > 0);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Пожалуйста, выберите оценку');
            return;
        }

        setIsSubmitting(true);
        const res = await reviewService.submitReview(calculationId, userId, rating);
        setIsSubmitting(false);

        if (res.success) {
            setIsSubmitted(true);
            toast.success('Спасибо за ваш отзыв!');
        } else {
            toast.error(res.error?.message || 'Не удалось отправить отзыв');
        }
    };

    if (isSubmitted) {
        return (
            <div className={`mt-4 p-6 rounded-3xl border-2 space-y-4 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-500 ${
                isOwn ? 'bg-white/10 border-white/20 text-white' : 'bg-green-500/5 border-green-500/10 text-foreground'
            }`}>
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isOwn ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-600'
                    }`}>
                        <CheckCircle size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Спасибо!</h4>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                                key={s} 
                                size={14} 
                                fill={s <= rating ? 'currentColor' : 'none'} 
                                className={s <= rating ? (isOwn ? 'text-white' : 'text-green-500') : (isOwn ? 'text-white/20' : 'text-gray-200')}
                            />
                        ))}
                    </div>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Ваша оценка принята</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`mt-4 p-6 rounded-3xl border-2 space-y-5 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-right-4 duration-500 ${
                isOwn
                    ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/20 text-white'
                    : 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 text-foreground'
            }`}
        >
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse" />

            <div className="text-center space-y-2 relative">
                <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                    isOwn ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-600'
                }`}>
                    <Star size={24} fill={rating > 0 ? 'currentColor' : 'none'} />
                </div>
                <h4 className="text-base font-black tracking-tight">{title}</h4>
                <p className="text-xs font-medium opacity-70">{subtitle}</p>
            </div>

            <div className="flex justify-center gap-2 py-2 relative">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        disabled={isOwn || isSubmitting}
                        onMouseEnter={() => !isOwn && setHoverRating(star)}
                        onMouseLeave={() => !isOwn && setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                            isOwn 
                                ? 'bg-white/10 border-white/10 pointer-events-none' 
                                : 'cursor-pointer hover:scale-110 active:scale-95'
                        } ${
                            star <= (hoverRating || rating)
                                ? isOwn ? 'bg-white/30 border-white/40' : 'bg-green-500/10 border-green-500/30'
                                : 'bg-white/5 border-transparent'
                        }`}
                    >
                        <Star
                            size={20}
                            className={`${
                                star <= (hoverRating || rating)
                                    ? isOwn ? 'text-white' : 'text-green-500'
                                    : isOwn ? 'text-white/20' : 'text-gray-200'
                            } transition-colors`}
                            fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                        />
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isOwn || isSubmitting || rating === 0}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] border shadow-lg flex items-center justify-center gap-2 ${
                    isOwn
                        ? 'bg-white/20 text-white border-white/10 opacity-50 cursor-default'
                        : rating === 0 
                            ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                            : 'bg-green-500 text-white border-green-600 hover:bg-green-600 hover:shadow-green-500/40'
                }`}
            >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Оставить отзыв'}
            </button>
        </div>
    );
};
