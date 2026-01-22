import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ChatRecipient } from '../../types';

interface ChatHeaderProps {
    selectedUser: ChatRecipient;
    onBack?: () => void;
    isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedUser, onBack, isOnline }) => {
    return (
        <div className="p-6 border-b border-border-theme bg-background flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 hover:bg-primary/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-xl overflow-hidden">
                    {selectedUser.avatar_url ? (
                        <img
                            src={selectedUser.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        selectedUser.first_name?.[0] || selectedUser.organization_name?.[0]
                    )}
                </div>
                <div>
                    <h3 className="text-[14px] font-black tracking-tight">
                        {selectedUser.role === 'client'
                            ? selectedUser.organization_name
                            : `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() ||
                              selectedUser.organization_name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}
                        />
                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                            {isOnline ? 'В сети' : 'Не в сети'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
