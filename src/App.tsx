import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import TripCreator from "./pages/TripCreator";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "./components/Header"; // Import the Header
import TripDetail from "./pages/TripDetail";
import MyTrips from "./pages/MyTrips";
import Inspirations from "./pages/Inspiration";
import InspirationDetail from "./pages/InspirationDetail";
import Friends from "./pages/Friends";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

// Create a layout component to wrap pages with the header
const MainLayout = () => (
  <>
    <Header />
    <main className="pt-16"> {/* Padding to avoid content hiding behind fixed header */}
      <Outlet />
    </main>
    <Footer />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Routes with the main floating header */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-trips" element={<MyTrips />} />
                <Route path="/trip/new" element={<TripCreator />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/inspirations" element={<Inspirations />} />
                <Route path="/inspirations/:id" element={<InspirationDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/my-trips/:tripId" element={<TripDetail />} />
                <Route path="/friends" element={<Friends />} />
              </Route>
            </Route>

            {/* Auth routes can have their own layout (without the main header) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;