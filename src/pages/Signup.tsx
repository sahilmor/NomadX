import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthLayout from "@/components/AuthLayout";
import { signUpWithPassword, signInWithGoogle } from "@/services/auth.service";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const Signup = () => {
  const { user, isLoading } = useAuth();
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user) {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner fullscreen text="Checking authentication..." />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUpWithPassword({
      email,
      password,
      options: {
        data: {
          full_name: username,
          username: username,
        },
      },
    });

    if (error) {
      let description = error.message;

      if (error.message.includes("User_userName_key")) {
        description =
          "This username is already taken. Please try another one.";
      } else if (error.message.includes("users_email_key")) {
        description = "This email is already associated with an account.";
      }

      toast({
        title: "Error signing up",
        description,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Account created. Please check your email to verify.",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <Card className="w-full border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader className="text-center p-6 sm:p-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
            Create Your Account
          </CardTitle>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Join NomadX and start your adventure
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
          <form onSubmit={handleSignUp} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base">
                User Name
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="User Name"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">
                Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-lg font-semibold rounded-lg shadow-md transition-all"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="relative my-6 sm:my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-[11px] sm:text-sm uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 sm:h-12 text-sm sm:text-lg font-semibold rounded-lg border-emerald-600 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800"
            onClick={handleGoogleSignIn}
          >
            <svg
              className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 
                504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 
                172.9 61.9l-76.3 64.5c-24.3-23.4-56.3-38.3-96.6-38.3-73.2 
                0-133.2 59.9-133.2 133.2s59.9 133.2 133.2 
                133.2c76.3 0 119.8-33.6 126-72.9H248v-94.2h238.2z"
              ></path>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Signup;