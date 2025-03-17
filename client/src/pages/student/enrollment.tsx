import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentSidebar } from "@/components/student/sidebar"; // Điều chỉnh đường dẫn nếu cần
// import { CurrentCourses } from "@/components/student/current-courses"; // Điều chỉnh đường dẫn nếu cần

// Hàm gọi API để lấy danh sách môn học khả dụng
const fetchAvailableCourses = async () => {
  const res = await fetch("/api/monhoc", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch available courses");
  return res.json();
};

// Hàm gọi API để đăng ký học phần
const registerCourse = async (monHocId: number) => {
  const res = await fetch("/api/sinhvien/dangky", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monHocId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to register course");
  }
  return res.json();
};

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  // Fetch danh sách học phần đã đăng ký
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/sinhvien/dangkyhocphan"],
    queryFn: async () => {
      const res = await fetch("/api/sinhvien/dangkyhocphan");
      if (!res.ok) throw new Error("Failed to fetch dangkyhocphan");
      return res.json();
    },
  });

  // Fetch danh sách môn học khả dụng
  const { data: availableCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/monhoc"],
    queryFn: fetchAvailableCourses,
  });

  // Mutation để đăng ký học phần
  const registerMutation = useMutation({
    mutationFn: registerCourse,
    onSuccess: () => {
      // Cập nhật lại danh sách học phần đã đăng ký sau khi đăng ký thành công
      queryClient.invalidateQueries({
        queryKey: ["/api/sinhvien/dangkyhocphan"],
      });
    },
    onError: (error) => {
      alert(`Lỗi đăng ký học phần: ${error.message}`);
    },
  });

  // State để quản lý môn học được chọn
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Xử lý đăng ký học phần
  const handleRegister = () => {
    if (selectedCourseId) {
      registerMutation.mutate(selectedCourseId);
      setSelectedCourseId(null); // Reset sau khi đăng ký
    }
  };

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
              Đăng ký học phần
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Quản lý và đăng ký các môn học cho kỳ học hiện tại
            </p>
          </div>

          {/* Current Courses */}
          <div className="mb-6">
            {isLoadingEnrollments ? (
              <p className="text-gray-500">Đang tải học phần đã đăng ký...</p>
            ) : (
              <CurrentCourses enrollments={enrollments || []} />
            )}
          </div>

          {/* Available Courses Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Các học phần đang mở đăng ký
              </h2>
              {isLoadingCourses ? (
                <p className="text-gray-500">Đang tải danh sách môn học...</p>
              ) : (
                <div className="mt-4">
                  {availableCourses && availableCourses.length > 0 ? (
                    <div className="space-y-4">
                      {/* Danh sách môn học dạng bảng */}
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mã môn
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tên môn
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Số tín chỉ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {availableCourses.map((course: any) => (
                            <tr key={course.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {course.maMon}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {course.tenMon}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {course.soTinChi}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => setSelectedCourseId(course.id)}
                                  disabled={
                                    enrollments?.some(
                                      (e: any) => e.monHocId === course.id
                                    ) || registerMutation.isPending
                                  }
                                  className={`px-3 py-1 rounded-md text-white ${
                                    enrollments?.some(
                                      (e: any) => e.monHocId === course.id
                                    )
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700"
                                  }`}
                                >
                                  {enrollments?.some(
                                    (e: any) => e.monHocId === course.id
                                  )
                                    ? "Đã đăng ký"
                                    : "Đăng ký"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Nút xác nhận đăng ký */}
                      {selectedCourseId && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={handleRegister}
                            disabled={registerMutation.isPending}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
                          >
                            {registerMutation.isPending
                              ? "Đang xử lý..."
                              : "Xác nhận đăng ký"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Hiện tại không có học phần nào mở đăng ký.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Giả định CurrentCourses nhận props enrollments
interface CurrentCoursesProps {
  enrollments: any[];
}
const CurrentCourses: React.FC<CurrentCoursesProps> = ({ enrollments }) => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Học phần đã đăng ký
      </h2>
      {enrollments.length > 0 ? (
        <ul className="space-y-2">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="p-4 bg-gray-50 rounded-md shadow-sm"
            >
              <p className="text-sm font-medium text-gray-900">
                {enrollment.monHoc?.tenMon} ({enrollment.monHoc?.maMon})
              </p>
              <p className="text-sm text-gray-600">
                Trạng thái: {enrollment.trangThai}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          Bạn chưa đăng ký học phần nào cho kỳ này.
        </p>
      )}
    </div>
  );
};
