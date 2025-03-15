import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import StudentDashboard from "@/pages/student/dashboard";
import FacultyDashboard from "@/pages/faculty/dashboard";
import StudentProfile from "@/pages/student/profile"; // Thêm import
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute
        path="/"
        component={() => <Redirect to="/student/dashboard" />}
      />
      <ProtectedRoute
        path="/student/dashboard"
        component={StudentDashboard}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/student/profile" // Thêm route mới
        component={StudentProfile}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/faculty/dashboard"
        component={FacultyDashboard}
        vaiTro="faculty"
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Simple redirect component
function Redirect({ to }: { to: string }) {
  window.location.href = to;
  return null;
}

export default App;
