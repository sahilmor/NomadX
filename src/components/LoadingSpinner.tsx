import React from 'react';
import { cn } from "@/lib/utils";

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
   * If true, the spinner will cover the entire screen as an overlay.
   * @default false
   */
  fullscreen?: boolean;
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
  fullscreen = false,
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
    border-primary 
    border-t-transparent
    ${sizeClasses[size]}
  `;

  // Conditionally apply fullscreen overlay styles
  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-4",
    fullscreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
    className
  );

  return (
    <div className={containerClasses} aria-live="polite" aria-busy="true">
      <div className={spinnerClasses}></div>
      {text && <p className="text-muted-foreground text-lg animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;