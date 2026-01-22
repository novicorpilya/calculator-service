import React, { forwardRef } from 'react';

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
    error?: string;
}

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
    ({ className = '', icon, rightIcon, onRightIconClick, error, ...props }, ref) => {
        const hasError = !!error;

        return (
            <div className="w-full space-y-2">
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors flex items-center justify-center">
                            {React.isValidElement(icon)
                                ? React.cloneElement(
                                      icon as React.ReactElement<{ size?: number }>,
                                      { size: 16 }
                                  )
                                : icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        className={`
                        input-premium ${icon ? 'pl-11 sm:pl-16' : 'pl-4 sm:pl-6'} ${rightIcon ? 'pr-11 sm:pr-16' : 'pr-4 sm:pr-6'}
                        ${hasError ? 'border-red-500/50 bg-red-500/5' : ''}
                        ${className}
                    `}
                        {...props}
                    />

                    {rightIcon && (
                        <button
                            type="button"
                            onClick={onRightIconClick}
                            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors flex items-center justify-center"
                        >
                            {React.isValidElement(rightIcon)
                                ? React.cloneElement(
                                      rightIcon as React.ReactElement<{ size?: number }>,
                                      { size: 16 }
                                  )
                                : rightIcon}
                        </button>
                    )}
                </div>

                {error && (
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] ml-2 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

IconInput.displayName = 'IconInput';
