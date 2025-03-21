import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
} from "lucide-react";

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });

  const statItems = [
    {
      title: "Sinh viên",
      value: stats?.studentCount || 0,
      icon: <GraduationCap className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Giảng viên",
      value: stats?.facultyCount || 0,
      icon: <Users className="h-6 w-6" />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Lớp học",
      value: stats?.classCount || 0,
      icon: <School className="h-6 w-6" />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Môn học",
      value: stats?.courseCount || 0,
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${item.color} mr-4 flex items-center justify-center`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{item.title}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-semibold">{item.value}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Registration Period Status */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Thời gian đăng ký hiện tại</p>
              {isLoading ? (
                <Skeleton className="h-6 w-full mt-1" />
              ) : stats?.activeRegistrationPeriod ? (
                <div>
                  <p className="text-lg font-semibold">
                    {stats.activeRegistrationPeriod.hocKy} - {stats.activeRegistrationPeriod.namHoc}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(stats.activeRegistrationPeriod.thoiGianBatDau).toLocaleDateString('vi-VN')} - 
                    {new Date(stats.activeRegistrationPeriod.thoiGianKetThuc).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-yellow-600">
                  Không có thời gian đăng ký đang hoạt động
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}