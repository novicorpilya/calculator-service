import React from 'react'

interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
    className?: string
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    className = '',
}) => {
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
    }

    return (
        <button
            className={`${variantClasses[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    )
}
