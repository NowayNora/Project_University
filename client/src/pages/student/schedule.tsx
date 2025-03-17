import React, { useState } from "react";
import { CalendarView } from "@/components/student/calendar-view"; // Điều chỉnh đường dẫn nếu cần
import { ClassSchedule } from "@/components/student/class-schedule"; // Điều chỉnh đường dẫn nếu cần
import { StudentSidebar } from "@/components/student/sidebar"; // Điều chỉnh đường dẫn nếu cần
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const daysOfWeek = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];
const timeSlots = ["Sáng", "Chiều", "Tối"];
const sampleSchedule = [
  {
    day: 1, // Thứ 2
    timeSlot: 0, // Sáng
    courseCode: "DHCNTT16B",
    courseName: "Lập trình web với PHP và MySQL",
    time: "12 - 14",
    faculty: "Nguyễn Phúc Hậu",
  },
  {
    day: 1, // Thứ 2
    timeSlot: 2, // Tối
    courseCode: "DHCNTT16B",
    courseName: "Lập trình web với PHP và MySQL",
    time: "12 - 14",
    faculty: "Nguyễn Phúc Hậu",
  },
  {
    day: 2, // Thứ 3
    timeSlot: 2, // Tối
    courseCode: "DHCNTT16B",
    courseName: "Lập trình web với PHP và MySQL",
    time: "12 - 14",
    faculty: "Nguyễn Phúc Hậu",
  },
  // Thêm dữ liệu khác nếu cần
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date("2025-03-16"));

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Bắt đầu từ Thứ 2
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <StudentSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Lịch học, lịch thi theo tuần
            </h1>
          </div>

          {/* Navigation and Date Picker */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" className="rounded-full">
                Tất cả
              </Button>
              <Button variant="outline" className="rounded-full">
                Lịch học
              </Button>
              <Button variant="outline" className="rounded-full">
                Lịch thi
              </Button>
              <Button variant="outline" className="rounded-full">
                In lịch
              </Button>
              <Button variant="outline" className="rounded-full">
                Trở về
              </Button>
              <Button variant="outline" className="rounded-full">
                Tiếp
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span>16/03/2025</span>
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-20"></th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="border p-2 text-center">
                      {daysOfWeek[index]}
                      <br />
                      {date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </th>
                  ))}
                  <th className="border p-2 w-40">Chú thích</th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, rowIndex) => (
                  <tr key={rowIndex} className="border">
                    <td className="border p-2 bg-yellow-100 text-center font-bold">
                      {slot}
                    </td>
                    {weekDates.map((date, colIndex) => {
                      const scheduleItem = sampleSchedule.find(
                        (item) =>
                          item.day === colIndex + 1 &&
                          item.timeSlot === rowIndex
                      );
                      return (
                        <td key={colIndex} className="border p-2">
                          {scheduleItem && (
                            <div className="bg-green-100 p-2 rounded">
                              <p>{scheduleItem.courseName}</p>
                              <p>{scheduleItem.courseCode}</p>
                              <p>Tiết: {scheduleItem.time}</p>
                              <p>GV: {scheduleItem.faculty}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border p-2">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-200 mr-2"></div>
                          <span>Lịch học thuyết</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-200 mr-2"></div>
                          <span>Lịch học thực hành</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-200 mr-2"></div>
                          <span>Lịch học trực tuyến</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-200 mr-2"></div>
                          <span>Lịch thi</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-200 mr-2"></div>
                          <span>Lịch tạm ứng</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
