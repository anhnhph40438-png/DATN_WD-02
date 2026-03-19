import React from 'react';

const variantClasses = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-primary-50 text-primary-800 border-primary-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-dark-50 text-dark-600 border-dark-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200'
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

const Badge = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  dot = false
}) => {
  return (
    <span
      className={`
        inline-flex items-center
        font-medium rounded-md border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full mr-1.5
            ${variant === 'success' ? 'bg-green-500' : ''}
            ${variant === 'warning' ? 'bg-primary-500' : ''}
            ${variant === 'danger' ? 'bg-red-500' : ''}
            ${variant === 'info' ? 'bg-blue-500' : ''}
            ${variant === 'neutral' ? 'bg-dark-400' : ''}
            ${variant === 'primary' ? 'bg-primary-500' : ''}
          `}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
