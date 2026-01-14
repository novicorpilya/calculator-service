import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles =
        'px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100',
        secondary: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100',
        ghost: 'bg-transparent text-gray-500 hover:bg-gray-50',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};
