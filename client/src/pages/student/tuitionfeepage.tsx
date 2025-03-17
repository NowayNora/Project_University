import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentSidebar } from "@/components/student/sidebar"; // Điều chỉnh đường dẫn nếu cần

// Định nghĩa interface
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

// Hàm gọi API để lấy danh sách thanh toán học phí
const fetchTuitionFees = async () => {
  const res = await fetch("/api/sinhvien/thanhtoanhocphi", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch tuition fees");
  return res.json();
};

// Hàm gọi API để lấy danh sách học phần đã đăng ký
// Hàm fetchEnrollments với kiểu trả về cụ thể
const fetchEnrollments = async (): Promise<Enrollment[]> => {
  const res = await fetch("/api/sinhvien/dangkyhocphan", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  return res.json();
};

// Hàm gọi API để thực hiện thanh toán
const makePayment = async (paymentData: {
  soTien: number;
  hocKy: string;
  namHoc: string;
}) => {
  const res = await fetch("/api/sinhvien/thanhtoan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to make payment");
  }
  return res.json();
};

export default function TuitionFeePage() {
  const queryClient = useQueryClient();

  // Fetch danh sách thanh toán học phí
  const { data: tuitionFees, isLoading: isLoadingFees } = useQuery({
    queryKey: ["/api/sinhvien/thanhtoanhocphi"],
    queryFn: fetchTuitionFees,
  });

  // Fetch danh sách học phần đã đăng ký để tính học phí
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/sinhvien/dangkyhocphan"],
    queryFn: fetchEnrollments,
  });

  // Mutation để thực hiện thanh toán
  const paymentMutation = useMutation({
    mutationFn: makePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/sinhvien/thanhtoanhocphi"],
      });
    },
    onError: (error) => {
      alert(`Lỗi thanh toán: ${error.message}`);
    },
  });

  // Tính tổng học phí dựa trên số tín chỉ đã đăng ký
  // Tính tổng học phí với kiểu rõ ràng
  const calculateTuition = (enrollments: Enrollment[]): number => {
    const totalCredits = enrollments.reduce(
      (sum: number, e: Enrollment) => sum + (e.monHoc?.soTinChi || 0),
      0
    );
    return totalCredits * 1000000; // 1 tín chỉ = 1 triệu VND
  };

  // Tạo dữ liệu thanh toán từ học phần đã đăng ký
  const generatePaymentData = (enrollments: any[]) => {
    if (!enrollments || enrollments.length === 0) return null;
    const totalTuition = calculateTuition(enrollments);
    const currentYear = new Date().getFullYear();
    return {
      soTien: totalTuition,
      hocKy: enrollments[0]?.hocKy || "Học kỳ 1", // Lấy học kỳ từ học phần đầu tiên
      namHoc: enrollments[0]?.namHoc || `${currentYear}-${currentYear + 1}`, // Lấy năm học từ học phần đầu tiên
    };
  };

  const handlePayment = () => {
    if (!enrollments || enrollments.length === 0) {
      alert("Không có học phần nào để thanh toán.");
      return;
    }
    const paymentData = generatePaymentData(enrollments);
    if (paymentData) {
      paymentMutation.mutate(paymentData);
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
            <h1 className="text-2xl font-bold text-gray-900">Học phí</h1>
            <p className="mt-1 text-sm text-gray-600">
              Xem và thanh toán học phí cho kỳ học hiện tại
            </p>
          </div>

          {/* Tuition Fee Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin học phí
              </h2>

              {isLoadingEnrollments || isLoadingFees ? (
                <p className="text-gray-500">Đang tải thông tin học phí...</p>
              ) : (
                <div className="space-y-6">
                  {/* Tổng học phí cần thanh toán */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700">
                      Tổng học phí kỳ này
                    </h3>
                    {enrollments && enrollments.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          Số tín chỉ đã đăng ký:{" "}
                          {enrollments.reduce(
                            (sum, e) => sum + (e.monHoc?.soTinChi || 0),
                            0
                          )}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          Tổng: {calculateTuition(enrollments).toLocaleString()}{" "}
                          VND
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Bạn chưa đăng ký học phần nào.
                      </p>
                    )}
                  </div>

                  {/* Lịch sử thanh toán */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">
                      Lịch sử thanh toán
                    </h3>
                    {tuitionFees && tuitionFees.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Học kỳ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Năm học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Số tiền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tuitionFees.map((fee: any) => (
                            <tr key={fee.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {fee.hocKy}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {fee.namHoc}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {Number(fee.soTien).toLocaleString()} VND
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    fee.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {fee.status === "paid"
                                    ? "Đã thanh toán"
                                    : "Chưa thanh toán"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Chưa có lịch sử thanh toán.
                      </p>
                    )}
                  </div>

                  {/* Nút thanh toán */}
                  {enrollments && enrollments.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={handlePayment}
                        disabled={
                          paymentMutation.isPending ||
                          tuitionFees?.some((fee: any) => fee.status === "paid")
                        }
                        className={`px-4 py-2 rounded-md text-white ${
                          paymentMutation.isPending ||
                          tuitionFees?.some((fee: any) => fee.status === "paid")
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {paymentMutation.isPending
                          ? "Đang xử lý..."
                          : tuitionFees?.some(
                              (fee: any) => fee.status === "paid"
                            )
                          ? "Đã thanh toán"
                          : "Thanh toán ngay"}
                      </button>
                    </div>
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
