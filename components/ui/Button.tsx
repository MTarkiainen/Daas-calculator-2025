import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'inverted';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'label';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  as = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';

  const variantClasses = {
    primary: 'bg-chg-active-blue text-white hover:bg-brand-700 focus:ring-brand-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-brand-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    inverted: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const leftIconMargin = 'mr-2';
  const rightIconMargin = 'ml-2';

  const Component = as;

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...(props as any)}
    >
      {leftIcon && <span className={leftIconMargin}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={rightIconMargin}>{rightIcon}</span>}
    </Component>
  );
};
