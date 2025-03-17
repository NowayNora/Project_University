import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Định nghĩa kiểu dữ liệu cho lịch giảng dạy
interface ScheduleItem {
  id: number;
  ngay: string;
  tietBatDau: string;
  tietKetThuc?: string;
  monHoc: {
    tenMonHoc: string;
  };
  lop: string;
  phongHoc: string;
}

interface TeachingScheduleProps {
  limit?: number;
  showViewAll?: boolean;
  date?: Date;
}

export function TeachingSchedule({
  limit = 3,
  showViewAll = true,
  date = new Date(),
}: TeachingScheduleProps) {
  const { data: scheduleData, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/giangvien/lichgiangday"],
  });

  const todayClasses =
    scheduleData?.filter((item) => {
      const scheduleDate = new Date(item.ngay);
      return (
        scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear()
      );
    }) || [];

  const displayClasses = todayClasses.slice(0, limit);

  const formatTime = (time: string) => {
    return time;
  };

  const getStatusBadge = (startTime: string) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(":").map(Number);
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes);

    const isUpcoming = scheduleTime > now;
    const diff = Math.abs(scheduleTime.getTime() - now.getTime());
    const isOngoing = !isUpcoming && diff < 90 * 60 * 1000;

    if (isOngoing) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">
          Đang diễn ra
        </span>
      );
    } else if (isUpcoming) {
      return (
        <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1">
          Sắp diễn ra
        </span>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">
          Lịch giảng dạy hôm nay
        </CardTitle>
        {showViewAll && (
          <a
            href="/giangvien/lichgiangday"
            className="text-sm text-primary hover:underline"
          >
            Xem tất cả
          </a>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <Skeleton className="h-4 w-10" />
                  <div className="h-full w-px bg-gray-300 my-1"></div>
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : displayClasses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {displayClasses.map((classItem, index: number) => (
              <div key={index} className="p-4 flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <span className="text-xs text-gray-500">
                    {formatTime(classItem.tietBatDau)}
                  </span>
                  <div className="h-full w-px bg-gray-300 my-1"></div>
                  <span className="text-xs text-gray-500">
                    {formatTime(classItem.tietKetThuc || "N/A")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">
                      {classItem.monHoc.tenMonHoc || "N/A"}
                    </h4>
                    {getStatusBadge(classItem.tietBatDau)}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-group-line mr-1"></i>
                      <span>{classItem.lop || "..."}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>{classItem.phongHoc || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              Không có lịch giảng dạy nào cho hôm nay
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
