import React, { forwardRef } from 'react'

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    rightIcon?: React.ReactNode
    onRightIconClick?: () => void
    error?: string
}

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(({
    type = 'text',
    className = '',
    icon,
    rightIcon,
    onRightIconClick,
    error,
    ...props
}, ref) => {
    const hasError = !!error

    return (
        <div className="relative group w-full">
            {icon && (
                <div className={`absolute left-4 top-[14px] w-5 h-5 flex items-center justify-center transition-colors duration-200 z-10 pointer-events-none
                    ${hasError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
                </div>
            )}

            <input
                ref={ref}
                type={type}
                className={`w-full ${icon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'} py-3 
                    bg-gray-50 border-2 rounded-xl outline-none transition-shadow duration-200 
                    font-medium text-gray-900 placeholder:text-gray-400
                    ${hasError
                        ? 'border-red-200 focus:border-red-500 bg-red-50/30'
                        : 'border-transparent focus:border-blue-500 bg-gray-50 focus:bg-white focus:shadow-sm'
                    } ${className}`}
                {...props}
            />

            {rightIcon && (
                <button
                    type="button"
                    onClick={onRightIconClick}
                    className={`absolute right-4 top-[14px] w-5 h-5 flex items-center justify-center transition-colors z-10
                        ${hasError ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-blue-500'}`}
                >
                    {React.isValidElement(rightIcon) ? React.cloneElement(rightIcon as React.ReactElement<any>, { size: 20 }) : rightIcon}
                </button>
            )}

            {error && (
                <p className="mt-1.5 ml-1 text-[10px] font-black text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    )
})

IconInput.displayName = 'IconInput'
