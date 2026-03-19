import React from 'react';

const Card = ({
  title,
  children,
  className = '',
  footer,
  headerActions,
  noPadding = false
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border border-dark-100
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      {(title || headerActions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          {title && (
            <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
          )}
          {headerActions && (
            <div className="flex items-center space-x-2">{headerActions}</div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 bg-dark-50 border-t border-dark-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
