import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FPMSProvider } from "@/contexts/FPMSContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FPMSForm from "./pages/FPMSForm";
import Review from "./pages/Review";
import Reports from "./pages/Reports";
import Faculty from "./pages/Faculty";
import Departments from "./pages/Departments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import TeachingLearning from "./pages/fpms/TeachingLearning";
import ResearchDevelopment from "./pages/fpms/ResearchDevelopment";
import ProfessionalDevelopment from "./pages/fpms/ProfessionalDevelopment";
import StudentDevelopment from "./pages/fpms/StudentDevelopment";
import InstitutionalDevelopment from "./pages/fpms/InstitutionalDevelopment";
import Submissions from "./pages/Submissions";
import Appeals from "./pages/Appeals";
import College from "./pages/College";
import AddAdmin from "./pages/AddAdmin";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fpms-form"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FPMSForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <ProtectedRoute allowedRoles={['hod', 'committee']}>
            <Review />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['hod', 'committee', 'admin']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['hod', 'committee', 'admin']}>
            <Faculty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={['committee', 'admin']}>
            <Departments />
          </ProtectedRoute>
        }
      />
     
      <Route path="/fpms/teaching" element={<TeachingLearning />} />
          <Route path="/fpms/research" element={<ResearchDevelopment></ResearchDevelopment>} />
          <Route path="/fpms/professional" element={<ProfessionalDevelopment />} />
          <Route path="/fpms/student" element={<StudentDevelopment />} />
          <Route path="/fpms/institutional" element={<InstitutionalDevelopment />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/submissions" element={<Submissions></Submissions>}></Route>
      <Route path='/appeals' element={<Appeals></Appeals>}></Route>
      <Route path="/college" element={<College></College>}></Route>
      <Route path="/add" element={<AddAdmin></AddAdmin>}></Route>
      <Route path="/settings" element={<Settings></Settings>}></Route>
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FPMSProvider>
            <AppRoutes />
          </FPMSProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;