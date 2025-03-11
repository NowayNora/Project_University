import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export function SidebarLayout({ children, sidebar }: SidebarLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Sidebar */}
      <aside
        className={`bg-white w-64 border-r border-gray-200 fixed h-full z-20 transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-sm`}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile toggle button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleSidebar}
          className="bg-primary text-white p-3 rounded-full shadow-lg"
          size="icon"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center lg:hidden">
              <i className="ri-building-4-line text-2xl text-primary mr-2"></i>
              <h1 className="font-bold text-primary-600">ĐẠI HỌC XYZ</h1>
            </div>

            <div className="ml-auto flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    3
                  </span>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer">
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={user?.avatar || ""} alt={user?.fullName || ""} />
                      <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "UN"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-sm">
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="text-xs text-gray-600">
                        {user?.role === "student" ? "Sinh viên" : "Giảng viên"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Thông tin cá nhân</DropdownMenuItem>
                  <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </main>
    </div>
  );
}
