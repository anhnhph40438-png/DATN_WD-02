import React from 'react';
import Spinner from './Spinner';

const variantClasses = {
  primary: 'bg-dark-900 hover:bg-dark-950 text-white border-transparent focus:ring-dark-400',
  secondary: 'bg-primary-500 hover:bg-primary-600 text-white border-transparent focus:ring-primary-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
  outline: 'bg-transparent hover:bg-dark-50 text-dark-700 border-dark-200 focus:ring-primary-400',
  ghost: 'bg-transparent hover:bg-dark-50 text-dark-600 border-transparent focus:ring-dark-300'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg border
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Spinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;
