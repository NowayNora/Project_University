import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ClassManagement } from "@/components/admin/class-management";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RegistrationPeriodManagement } from "@/components/admin/registration-period-management";
import { AdminSidebar } from "@/components/admin/sidebar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import StudentDashboard from "@/pages/student/dashboard";
import FacultyDashboard from "@/pages/faculty/dashboard";
import TeachingPage from "@/pages/faculty/schedule";
import GradeManagementPage from "@/pages/faculty/grademanagement";
// import CreateResearchProjectPage from "@/pages/faculty/schedule";
import StudentProfile from "@/pages/student/profile"; // Thêm import
import SchedulePage from "@/pages/student/schedule"; // Thêm import
import EnrollmentPage from "@/pages/student/enrollment"; // Thêm import
import TuitionFeePage from "@/pages/student/tuitionfeepage"; // Thêm import
import TrainingProgramPage from "@/pages/student/trainingprogram"; // Thêm import
import PaymentPage from "@/pages/student/payment"; // Thêm import
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* <ProtectedRoute
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
        path="/student/schedule" // Thêm route mới
        component={SchedulePage}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/student/enrollment" // Thêm route mới
        component={EnrollmentPage}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/student/tuition" // Thêm route mới
        component={TuitionFeePage}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/student/curriculum" // Thêm route mới
        component={TrainingProgramPage}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/student/payment" // Thêm route mới
        component={PaymentPage}
        vaiTro="student"
      />
      <ProtectedRoute
        path="/faculty/dashboard"
        component={FacultyDashboard}
        vaiTro="faculty"
      />
      <ProtectedRoute
        path="/giangvien/lophoc" //lịch dạy
        component={TeachingPage}
        vaiTro="faculty"
      />
      <ProtectedRoute path="/giangvien/tailieu" component={} vaiTro="faculty" />
      <ProtectedRoute
        path="/giangvien/quanlydiem"
        component={GradeManagementPage}
        vaiTro="faculty"
      /> */}
      {/* <ProtectedRoute
        path="/admin/registration-periods"
        component={RegistrationPeriodManagement}
        vaiTro="admin"
      /> */}

      <Route path="/" component={AuthPage} />
      {/* <Route
        path="/admin/registration-periods"
        component={RegistrationPeriodManagement}
      /> */}
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
