import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors bg-white/50 dark:bg-black/50 px-3 py-2 rounded-md">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Background Shapes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-teal-100 via-transparent to-transparent dark:from-teal-900/50"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-coral-100/50 dark:bg-coral-900/30 rounded-tl-full -translate-y-1/4 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-mustard-100/50 dark:bg-mustard-900/30 rounded-tr-full translate-y-1/4 -translate-x-1/4"></div>
      </div>


      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;