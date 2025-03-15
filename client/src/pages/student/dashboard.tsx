import React from "react";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { StudentSidebar } from "@/components/student/sidebar";
import { ClassSchedule } from "@/components/student/class-schedule";
import { CalendarView } from "@/components/student/calendar-view";
import { CurrentCourses } from "@/components/student/current-courses";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboard() {
  const { user } = useAuth();

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/thongbao"],
    queryFn: async () => {
      const res = await fetch("/api/thongbao");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  // Fetch enrollments for stats
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/sinhvien/dangkyhocphan"],
    queryFn: async () => {
      const res = await fetch("/api/sinhvien/dangkyhocphan");
      if (!res.ok) throw new Error("Failed to fetch dangkyhocphan");
      return res.json();
    },
  });

  // Fetch tuition fee information
  const { data: tuitionData, isLoading: isLoadingTuition } = useQuery({
    queryKey: ["/api/sinhvien/thanhtoanhocphi"],
    queryFn: async () => {
      const res = await fetch("/api/sinhvien/thanhtoanhocphi");
      if (!res.ok) throw new Error("Failed to fetch thanhtoanhocphi");
      return res.json();
    },
  });

  // Calculate stats
  const currentCoursesCount = enrollments?.length || 0;
  const gpa = profileData?.student?.gpa || 3.5;
  const creditsCompleted = profileData?.student?.creditsCompleted || 65;
  const totalCreditsRequired =
    profileData?.student?.totalCreditsRequired || 120;

  // Calculate total unpaid tuition
  const calculateTuition = () => {
    if (!tuitionData) return "Đang tải...";

    const unpaidTuition = tuitionData
      .filter((fee: any) => fee.status !== "paid")
      .reduce((sum: number, fee: any) => sum + (fee.remaining || 0), 0);

    return new Intl.NumberFormat("vi-VN").format(unpaidTuition) + "đ";
  };

  return (
    <SidebarLayout sidebar={<StudentSidebar />}>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Dashboard</h2>
          <p className="text-gray-600">
            Xin chào, <span>{user?.fullName || "Sinh viên"}</span>! Chào mừng
            trở lại.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Current Courses */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <i className="ri-book-open-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Môn học hiện tại</p>
                  {isLoadingEnrollments ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">
                      {currentCoursesCount} môn
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPA */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <i className="ri-bar-chart-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Điểm GPA</p>
                  {isLoadingProfile ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">{gpa}/4.0</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                  <i className="ri-calendar-check-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiến độ học tập</p>
                  {isLoadingProfile ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold">
                      {creditsCompleted}/{totalCreditsRequired} tín chỉ
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tuition */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <i className="ri-money-dollar-circle-line text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Học phí kỳ này</p>
                  {isLoadingTuition ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <p className="text-lg font-semibold text-red-500">
                      {calculateTuition()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule and notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Schedule */}
          <div className="lg:col-span-2">
            <ClassSchedule />
          </div>

          {/* Notifications */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold">Thông báo mới</h3>
                <a href="#" className="text-sm text-primary hover:underline">
                  Xem tất cả
                </a>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
                <div className="divide-y divide-gray-200">
                  {/* Notification items */}
                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 text-red-500 rounded mr-3">
                        <i className="ri-calendar-event-line"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          Lịch thi cuối kỳ đã được cập nhật
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          1 giờ trước
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="p-2 bg-green-100 text-green-500 rounded mr-3">
                        <i className="ri-file-list-line"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          Điểm quá trình môn Lập trình Web đã được cập nhật
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          3 giờ trước
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-100 text-blue-500 rounded mr-3">
                        <i className="ri-book-open-line"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          Mở đăng ký học phần học kỳ tới
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          1 ngày trước
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="p-2 bg-yellow-100 text-yellow-500 rounded mr-3">
                        <i className="ri-money-dollar-circle-line"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          Nhắc nhở thanh toán học phí
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          2 ngày trước
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          <CalendarView />
        </div>

        {/* Current Courses */}
        <div className="mb-6">
          <CurrentCourses />
        </div>
      </div>
    </SidebarLayout>
  );
}
