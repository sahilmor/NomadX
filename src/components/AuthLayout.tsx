import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-hidden">
      {/* Back to Home */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors bg-white/60 dark:bg-black/60 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="hidden xs:inline">Back to Home</span>
          <span className="xs:hidden">Back</span>
        </Link>
      </div>

      {/* Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Main gradient wash */}
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-teal-100 via-transparent to-transparent dark:from-teal-900/50" />

        {/* Accent bubbles – softer on small screens */}
        <div className="hidden sm:block absolute bottom-0 right-0 w-2/3 h-2/3 bg-coral-100/50 dark:bg-coral-900/30 rounded-tl-full -translate-y-1/4 translate-x-1/4" />
        <div className="hidden sm:block absolute bottom-0 left-0 w-1/2 h-1/2 bg-mustard-100/50 dark:bg-mustard-900/30 rounded-tr-full translate-y-1/4 -translate-x-1/4" />
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;