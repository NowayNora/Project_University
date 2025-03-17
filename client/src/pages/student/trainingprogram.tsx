import React from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentSidebar } from "@/components/student/sidebar";

// Định nghĩa interface cho môn học và học phần
interface MonHoc {
  id: number;
  maMon: string;
  tenMon: string;
  soTinChi: number;
}

interface Enrollment {
  id: number;
  sinhVienId: number;
  monHocId: number;
  hocKy: string;
  namHoc: string;
  ngayDangKy: string;
  trangThai: string;
  monHoc: MonHoc | null;
}

// Hàm gọi API để lấy danh sách học phần đã đăng ký
const fetchEnrollments = async (): Promise<Enrollment[]> => {
  const res = await fetch("/api/sinhvien/dangkyhocphan", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  return res.json();
};

// Hàm tính số tiết lý thuyết (LT) và thực hành (TH) dựa trên số tín chỉ
const calculateLectureAndPracticeHours = (
  soTinChi: number
): {
  soTietLT: number;
  soTietTH: number;
} => {
  // Giả định: 1 tín chỉ = 15 tiết LT + 15 tiết TH (có thể điều chỉnh dựa trên quy định thực tế)
  const soTietLT = soTinChi * 15;
  const soTietTH = soTinChi * 15;
  return { soTietLT, soTietTH };
};

// Giả định trạng thái "Đạt" dựa trên dữ liệu (có thể lấy từ API quanlydiem sau)
const isPassed = (enrollment: Enrollment): boolean => {
  // Logic đơn giản: giả định đã đạt nếu trạng thái là "Đăng ký"
  return enrollment.trangThai === "Đăng ký";
};

export default function TrainingProgramPage() {
  const {
    data: enrollments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/sinhvien/dangkyhocphan"],
    queryFn: fetchEnrollments,
  });

  if (isLoading) return <p className="p-6 text-gray-500">Đang tải...</p>;
  if (error) return <p className="p-6 text-red-500">Lỗi: {error.message}</p>;

  // Tính tổng số tín chỉ bắt buộc và tự chọn
  const mandatoryCredits =
    enrollments
      ?.filter((e) => e.monHoc?.maMon.startsWith("HPB")) // Giả định mã bắt buộc
      .reduce((sum, e) => sum + (e.monHoc?.soTinChi || 0), 0) || 0;
  const electiveCredits =
    enrollments
      ?.filter((e) => e.monHoc?.maMon.startsWith("HPT")) // Giả định mã tự chọn
      .reduce((sum, e) => sum + (e.monHoc?.soTinChi || 0), 0) || 0;
  const totalCredits =
    enrollments?.reduce((sum, e) => sum + (e.monHoc?.soTinChi || 0), 0) || 0;

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
              CHƯƠNG TRÌNH KHUNG
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Mã sinh viên: 217060118 | Hệ đào tạo: Đại học | Khoa: Khoa Kỹ
              thuật Công nghệ | Lớp học: DHCNTT16B | Ngày in phiếu: 16/03/2025
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên môn học/Học phần
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã học phần
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học phần
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số TC
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiết LT
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiết TH
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhóm
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số TC bắt buộc
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đạt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments?.map((enrollment, index) => {
                  const { soTietLT, soTietTH } =
                    calculateLectureAndPracticeHours(
                      enrollment.monHoc?.soTinChi || 0
                    );
                  const passed = isPassed(enrollment);

                  return (
                    <tr key={enrollment.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.monHoc?.tenMon || "Chưa xác định"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.monHoc?.maMon || ""}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.monHoc?.maMon.startsWith("HPB")
                          ? "Học phần bắt buộc"
                          : "Học phần tự chọn"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.monHoc?.soTinChi || 0}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {soTietLT}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {soTietTH}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.monHoc?.maMon.startsWith("HPB")
                          ? enrollment.monHoc?.soTinChi || 0
                          : 0}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {passed ? (
                          <span className="text-green-600">Đạt</span>
                        ) : (
                          <span className="text-red-600">Không đạt</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Tổng số tín chỉ */}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-4 py-2 text-sm text-gray-900">
                    Tổng TC yêu cầu
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {totalCredits}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    -
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {mandatoryCredits}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-4 py-2 text-sm text-gray-900">
                    Tổng TC bắt buộc
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {mandatoryCredits}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    -
                  </td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-4 py-2 text-sm text-gray-900">
                    Tổng TC tự chọn
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {electiveCredits}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    -
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-6 text-sm text-gray-600">
            <p>
              * Nhấn vào tên môn học/Học phần để xem chi tiết thông tin học phần
            </p>
            <p>
              Môn học/Học phần đã (hoặc đang) học Môn học sinh viên chưa đăng ký
              học tập
            </p>
            <div className="flex space-x-2">
              <span className="text-green-600">✔ Đạt</span>
              <span className="text-red-600">✘ Không đạt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
