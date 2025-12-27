

import React from 'react'

interface IconInputProps {
    type?: string
    placeholder?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    disabled?: boolean
    className?: string
    icon?: React.ReactNode
    rightIcon?: React.ReactNode
    onRightIconClick?: () => void
    name?: string
    required?: boolean
    error?: string
}

export const IconInput: React.FC<IconInputProps> = ({
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    disabled = false,
    className = '',
    icon,
    rightIcon,
    onRightIconClick,
    name,
    required = false,
    error,
}) => {
    const hasError = !!error
    const borderColor = hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent focus:ring-blue-500'
    
    return (
        <div className="relative">
            {icon && (
                <div className={`absolute left-3 top-3 w-5 h-5 flex-shrink-0 ${hasError ? 'text-red-400' : 'text-gray-400'}`}>
                    {icon}
                </div>
            )}
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
                className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${rightIcon ? 'pr-10' : 'pr-4'} py-2.5 border ${borderColor} rounded-lg focus:ring-2 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed ${hasError ? 'bg-red-50' : ''} ${className}`}
            />
            {rightIcon && (
                <button
                    type="button"
                    onClick={onRightIconClick}
                    className={`absolute right-3 top-3 transition ${hasError ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {rightIcon}
                </button>
            )}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}
