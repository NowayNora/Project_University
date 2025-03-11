import React from "react";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FacultySidebar } from "@/components/faculty/sidebar";
import { TeachingSchedule } from "@/components/faculty/teaching-schedule";
import { TodoList } from "@/components/faculty/todo-list";
import { ClassesTable } from "@/components/faculty/classes-table";
import { QuickActions } from "@/components/faculty/quick-actions";
import { ResearchProjects } from "@/components/faculty/research-projects";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacultyDashboard() {
  const { user } = useAuth();
  
  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/profile"],
  });
  
  // Fetch classes data
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/faculty/classes"],
  });
  
  // Fetch research projects
  const { data: researchData, isLoading: isLoadingResearch } = useQuery({
    queryKey: ["/api/faculty/research"],
  });

  // Calculate stats
  const classesCount = classesData?.length || 0;
  const teachingHours = profileData?.faculty?.teachingHours || 42;
  const supervisedStudentsCount = 8; // This would come from an API call in a real app
  const researchProjectsCount = researchData?.length || 0;

  return (
    <SidebarLayout sidebar={<FacultySidebar />}>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Dashboard</h2>
          <p className="text-gray-600">
            Xin chào, <span>{user?.fullName || "Giảng viên"}</span>! Chào mừng trở lại.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Classes Count */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <i className="ri-user-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lớp giảng dạy</p>
                  {isLoadingClasses ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">{classesCount} lớp</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Teaching Hours */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <i className="ri-time-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giờ giảng</p>
                  {isLoadingProfile ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">{teachingHours} giờ / tuần</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Supervised Students */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                  <i className="ri-graduation-cap-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sinh viên hướng dẫn</p>
                  <p className="text-lg font-semibold">{supervisedStudentsCount} sinh viên</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Research Projects */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <i className="ri-flask-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Công trình nghiên cứu</p>
                  {isLoadingResearch ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">{researchProjectsCount} đang thực hiện</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule and To-do list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Teaching Schedule */}
          <div className="lg:col-span-2">
            <TeachingSchedule />
          </div>
          
          {/* To-Do List */}
          <div>
            <TodoList />
          </div>
        </div>

        {/* Classes and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Classes table */}
          <div className="lg:col-span-3">
            <ClassesTable />
          </div>
          
          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Research Projects */}
        <div className="mb-6">
          <ResearchProjects />
        </div>
      </div>
    </SidebarLayout>
  );
}
