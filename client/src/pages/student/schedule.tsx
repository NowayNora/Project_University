import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { StudentSidebar } from "@/components/student/sidebar"; // Điều chỉnh đường dẫn nếu cần
import axios, { AxiosError } from "axios"; // Import axios và AxiosError

// Định nghĩa interface cho môn học đã đăng ký
interface RegisteredCourse {
  id: number;
  monHocId: number;
  monHoc: {
    id: number;
    maMon: string;
    tenMon: string;
    soTinChi: number;
  };
  trangThai: string;
}

// Định nghĩa interface cho lịch học khả dụng
interface AvailableSchedule {
  id: number;
  monHocId: number;
  thu: string;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string;
  buoiHoc: string;
  hocKy: string;
  namHoc: string;
}

// Định nghĩa interface cho lịch học của sinh viên
interface ScheduleItem {
  id: number;
  monHocId: number;
  thu: string;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string;
  loaiTiet: string; // Thêm trường loaiTiet
  monHoc?: {
    tenMon: string;
  };
}

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

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date("2025-03-16"));
  const [registeredCourses, setRegisteredCourses] = useState<
    RegisteredCourse[]
  >([]);
  const [availableSchedules, setAvailableSchedules] = useState<
    AvailableSchedule[]
  >([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [formData, setFormData] = useState({
    lichHocKhaDungId: "",
    thu: "",
    tietBatDau: "",
    soTiet: "",
    phongHoc: "",
    loaiTiet: "", // Thêm loaiTiet
    autoSchedule: false, // Thêm tùy chọn tự động sắp lịch
  });

  // Lấy danh sách môn học đã đăng ký
  const fetchRegisteredCourses = async () => {
    try {
      const response = await axios.get<RegisteredCourse[]>(
        "/api/sinhvien/dangkyhocphan",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setRegisteredCourses(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching registered courses:", axiosError);
      alert("Không thể tải danh sách môn học đã đăng ký.");
    }
  };

  // Lấy danh sách lịch học khả dụng
  const fetchAvailableSchedules = async (monHocId: string) => {
    try {
      const response = await axios.get<AvailableSchedule[]>(
        `/api/sinhvien/lichhoc/kha-dung?monHocId=${monHocId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setAvailableSchedules(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching available schedules:", axiosError);
      alert("Không thể tải danh sách lịch học khả dụng.");
    }
  };

  // Lấy lịch học hiện tại của sinh viên
  const fetchCurrentSchedule = async () => {
    try {
      const response = await axios.get<ScheduleItem[]>(
        "/api/sinhvien/lichhoc",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setScheduleData(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching current schedule:", axiosError);
      alert("Không thể tải lịch học hiện tại.");
    }
  };

  // Gửi yêu cầu chọn lịch học
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        lichHocKhaDungId: parseInt(formData.lichHocKhaDungId),
        ...(formData.thu && { thu: formData.thu }),
        ...(formData.tietBatDau && {
          tietBatDau: parseInt(formData.tietBatDau),
        }),
        ...(formData.soTiet && { soTiet: parseInt(formData.soTiet) }),
        ...(formData.phongHoc && { phongHoc: formData.phongHoc }),
        ...(formData.loaiTiet && { loaiTiet: formData.loaiTiet }),
        autoSchedule: formData.autoSchedule, // Thêm tùy chọn tự động sắp lịch
      };
      const response = await axios.post("/api/sinhvien/lichhoc/chon", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Đã chọn lịch học thành công!");
      fetchCurrentSchedule(); // Cập nhật lại lịch học
      setFormData({
        lichHocKhaDungId: "",
        thu: "",
        tietBatDau: "",
        soTiet: "",
        phongHoc: "",
        loaiTiet: "",
        autoSchedule: false,
      });
      setAvailableSchedules([]); // Reset danh sách lịch khả dụng
      setSelectedCourseId(""); // Reset môn học đã chọn
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error submitting schedule:", axiosError);
      alert(
        "Có lỗi khi chọn lịch học: " +
          (axiosError.response?.data?.message || "Unknown error")
      );
    }
  };

  // Tính toán ngày trong tuần
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

  // Tải danh sách môn học đã đăng ký và lịch học hiện tại khi component mount
  useEffect(() => {
    fetchRegisteredCourses();
    fetchCurrentSchedule();
  }, []);

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
              Sắp xếp lịch học
            </h1>
          </div>

          {/* Form chọn và tùy chỉnh lịch học */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Chọn và sắp xếp lịch học
            </h2>
            <form onSubmit={handleSubmitSchedule}>
              <div className="grid grid-cols-2 gap-4">
                {/* Chọn môn học đã đăng ký */}
                <div>
                  <label className="block text-sm font-medium">Môn học</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setSelectedCourseId(e.target.value);
                      if (e.target.value) {
                        fetchAvailableSchedules(e.target.value);
                      } else {
                        setAvailableSchedules([]);
                      }
                    }}
                    className="mt-1 block w-full border rounded p-2"
                  >
                    <option value="">Chọn môn học</option>
                    {registeredCourses.map((course) => (
                      <option key={course.monHocId} value={course.monHocId}>
                        {course.monHoc.tenMon} ({course.monHoc.maMon})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn lịch học khả dụng */}
                <div>
                  <label className="block text-sm font-medium">
                    Lịch học khả dụng
                  </label>
                  <select
                    value={formData.lichHocKhaDungId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        lichHocKhaDungId: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border rounded p-2"
                    disabled={!selectedCourseId}
                  >
                    <option value="">Chọn lịch học</option>
                    {availableSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.thu} - Tiết {schedule.tietBatDau} (
                        {schedule.soTiet} tiết) - Phòng {schedule.phongHoc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tùy chỉnh thứ */}
                <div>
                  <label className="block text-sm font-medium">
                    Thứ (tùy chỉnh)
                  </label>
                  <select
                    value={formData.thu}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, thu: e.target.value })
                    }
                    className="mt-1 block w-full border rounded p-2"
                    disabled={formData.autoSchedule}
                  >
                    <option value="">Không thay đổi</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tùy chỉnh tiết bắt đầu */}
                <div>
                  <label className="block text-sm font-medium">
                    Tiết bắt đầu (tùy chỉnh)
                  </label>
                  <input
                    type="number"
                    value={formData.tietBatDau}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, tietBatDau: e.target.value })
                    }
                    placeholder="Nhập tiết bắt đầu (1-12)"
                    className="mt-1 block w-full border rounded p-2"
                    disabled={formData.autoSchedule}
                  />
                </div>

                {/* Tùy chỉnh số tiết */}
                <div>
                  <label className="block text-sm font-medium">
                    Số tiết (tùy chỉnh)
                  </label>
                  <input
                    type="number"
                    value={formData.soTiet}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, soTiet: e.target.value })
                    }
                    placeholder="Nhập số tiết (1-6)"
                    className="mt-1 block w-full border rounded p-2"
                    disabled={formData.autoSchedule}
                  />
                </div>

                {/* Tùy chỉnh phòng học */}
                <div>
                  <label className="block text-sm font-medium">
                    Phòng học (tùy chỉnh)
                  </label>
                  <input
                    type="text"
                    value={formData.phongHoc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, phongHoc: e.target.value })
                    }
                    placeholder="Nhập phòng học"
                    className="mt-1 block w-full border rounded p-2"
                    disabled={formData.autoSchedule}
                  />
                </div>

                {/* Chọn loại tiết (lý thuyết/thực hành) */}
                <div>
                  <label className="block text-sm font-medium">
                    Loại tiết (tùy chỉnh)
                  </label>
                  <select
                    value={formData.loaiTiet}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, loaiTiet: e.target.value })
                    }
                    className="mt-1 block w-full border rounded p-2"
                    disabled={formData.autoSchedule}
                  >
                    <option value="">Chọn loại tiết</option>
                    <option value="lyThuyet">Lý thuyết</option>
                    <option value="thucHanh">Thực hành</option>
                  </select>
                </div>

                {/* Checkbox tự động sắp lịch */}
                <div className="col-span-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoSchedule}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          autoSchedule: e.target.checked,
                          thu: e.target.checked ? "" : formData.thu,
                          tietBatDau: e.target.checked
                            ? ""
                            : formData.tietBatDau,
                          soTiet: e.target.checked ? "" : formData.soTiet,
                          phongHoc: e.target.checked ? "" : formData.phongHoc,
                          loaiTiet: e.target.checked ? "" : formData.loaiTiet,
                        })
                      }
                      className="mr-2"
                    />
                    Tự động sắp xếp lịch học
                  </label>
                </div>
              </div>

              {/* Nút xác nhận */}
              <Button type="submit" className="mt-4">
                {formData.autoSchedule
                  ? "Tự động sắp lịch"
                  : "Xác nhận lịch học"}
              </Button>
            </form>
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
                      const scheduleItem = scheduleData.find((item) => {
                        const dayMatch = item.thu === daysOfWeek[colIndex];
                        const timeSlotMatch =
                          (rowIndex === 0 && item.tietBatDau <= 6) ||
                          (rowIndex === 1 &&
                            item.tietBatDau >= 7 &&
                            item.tietBatDau <= 10) ||
                          (rowIndex === 2 && item.tietBatDau > 10);
                        return dayMatch && timeSlotMatch;
                      });
                      return (
                        <td key={colIndex} className="border p-2">
                          {scheduleItem && (
                            <div className="bg-green-100 p-2 rounded">
                              <p>
                                {scheduleItem.monHoc?.tenMon ||
                                  "Unknown Course"}
                              </p>
                              <p>
                                Tiết: {scheduleItem.tietBatDau} -{" "}
                                {scheduleItem.tietBatDau +
                                  scheduleItem.soTiet -
                                  1}
                              </p>
                              <p>Phòng: {scheduleItem.phongHoc}</p>
                              <p>
                                Loại:{" "}
                                {scheduleItem.loaiTiet === "lyThuyet"
                                  ? "Lý thuyết"
                                  : "Thực hành"}
                              </p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border p-2">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-200 mr-2"></div>
                          <span>Lịch học</span>
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
