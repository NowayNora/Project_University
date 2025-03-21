import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  BarChart3,
  School,
  FileText,
  Building,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/admin/dashboard",
    },
    {
      title: "Quản lý người dùng",
      icon: <Users className="h-5 w-5" />,
      path: "/admin/users",
    },
    {
      title: "Quản lý lớp học",
      icon: <School className="h-5 w-5" />,
      path: "/admin/classes",
    },
    {
      title: "Quản lý sinh viên",
      icon: <GraduationCap className="h-5 w-5" />,
      path: "/admin/students",
    },
    {
      title: "Quản lý giảng viên",
      icon: <Users className="h-5 w-5" />,
      path: "/admin/faculty",
    },
    {
      title: "Quản lý môn học",
      icon: <BookOpen className="h-5 w-5" />,
      path: "/admin/courses",
    },
    {
      title: "Quản lý khoa",
      icon: <Building className="h-5 w-5" />,
      path: "/admin/departments",
    },
    {
      title: "Thời gian đăng ký",
      icon: <Calendar className="h-5 w-5" />,
      path: "/admin/registration-periods",
    },
    {
      title: "Báo cáo",
      icon: <FileText className="h-5 w-5" />,
      path: "/admin/reports",
    },
    {
      title: "Cài đặt hệ thống",
      icon: <Settings className="h-5 w-5" />,
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    // logout();
    setLocation("/login");
  };

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-primary">Quản trị hệ thống</h2>
        <p className="text-sm text-muted-foreground">Trường Đại học</p>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.path}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              {user?.fullName?.charAt(0) || "A"}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.fullName || "Admin"}
            </p>
            <p className="text-xs text-gray-500">Quản trị viên</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
