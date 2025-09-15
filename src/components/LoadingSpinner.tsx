import React from 'react';

// Define the types for the component's props
interface LoadingSpinnerProps {
  /**
   * Defines the size of the spinner.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional text to display below the spinner.
   */
  text?: string;
  /**
   * Allows passing additional Tailwind CSS classes for custom styling.
   */
  className?: string;
}

/**
 * A reusable loading spinner component for global use in loading states.
 * Built with Tailwind CSS for easy integration.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  };

  const spinnerClasses = `
    animate-spin 
    rounded-full 
    border-blue-500 
    border-t-transparent 
    ${sizeClasses[size]}
    ${className}
  `;

  return (
    <div className="flex flex-col items-center justify-center gap-4" aria-live="polite" aria-busy="true">
      <div className={spinnerClasses}></div>
      {text && <p className="text-gray-600 text-lg animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;