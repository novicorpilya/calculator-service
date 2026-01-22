import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Venue } from '@/services/venue.service';

interface VenueSelectorProps {
    venues: Venue[];
    selectedVenueId?: string;
    onSelect: (venueId: string) => void;
    className?: string;
}

export const VenueSelector: React.FC<VenueSelectorProps> = ({
    venues,
    selectedVenueId,
    onSelect,
    className = '',
}) => {
    if (venues.length === 0) return null;

    return (
        <div
            className={`space-y-3 bg-primary/5 p-6 rounded-3xl border border-primary/10 ${className}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    Выбрать из существующих объектов
                </label>
            </div>
            <div className="relative group">
                <select
                    value={selectedVenueId || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="input-premium appearance-none cursor-pointer pr-10"
                >
                    <option value="">-- Выберите заведение --</option>
                    {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.name} ({v.total_area} м²)
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/20 group-hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};
