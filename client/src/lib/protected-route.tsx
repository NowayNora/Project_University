import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  vaiTro,
}: {
  path: string;
  component: () => React.JSX.Element;
  vaiTro?: "student" | "faculty" | "admin"; // Đồng bộ với server
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Kiểm tra vai trò từ user.role
  if (vaiTro && user.role !== vaiTro) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Từ chối truy cập
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Bạn không có quyền truy cập trang này. Trang này chỉ dành cho người
            dùng có vai trò {vaiTro}.
          </p>
          <a href="/" className="text-primary hover:underline">
            Quay lại trang chủ
          </a>
        </div>
      </Route>
    );
  }

  // Người dùng đăng nhập và có quyền truy cập
  return <Route path={path} component={Component} />;
}
