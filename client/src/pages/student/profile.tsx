import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { StudentSidebar } from "@/components/student/sidebar";
import { PlaceholderImage } from "@/components/ui/placeholder-image";

export default function StudentProfile() {
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile");
      const data = await res.json();
      console.log("Profile data:", data); // Thêm log này
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Lỗi: {(error as Error).message}</div>
      </div>
    );
  }

  const sinhVien = profile?.sinhVien;
  const lop = profile?.lop;
  const nganh = profile?.nganh;

  // Xử lý ảnh đại diện
  const avatarUrl =
    avatarPreview ||
    (sinhVien?.avatar
      ? `${import.meta.env.VITE_API_URL}/uploads/${sinhVien.avatar}`
      : null);
  console.log("Avatar URL:", avatarUrl); // Log để kiểm tra URL

  // Xử lý upload ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById(
      "avatar-upload"
    ) as HTMLInputElement;
    const formData = new FormData();
    if (fileInput.files && fileInput.files[0]) {
      formData.append("avatar", fileInput.files[0]);
      try {
        await apiRequest("POST", "/api/upload-avatar", formData);
        alert("Tải ảnh thành công!");
        setAvatarPreview(null); // Reset preview sau khi upload
        window.location.reload();
      } catch (error) {
        alert("Lỗi khi tải ảnh: " + (error as Error).message);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-white border-r border-gray-200">
        <StudentSidebar />
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-6 mb-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Ảnh học viên"
                className="w-32 h-32 rounded-full object-cover border border-gray-300"
                // onError={(e) => {
                //   console.error("Image failed to load");
                //   (e.target as HTMLImageElement).src = "";
                //   setAvatarPreview(null);
                // }}
              />
            ) : (
              <PlaceholderImage
                text="Chưa có ảnh"
                width={128}
                height={128}
                className="rounded-full border border-gray-300"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Thông tin học viên
              </h1>
              <div className="mt-2 space-y-1 text-gray-600">
                <p>
                  <strong>MSSV:</strong> {sinhVien?.maSv || "N/A"}
                </p>
                <p>
                  <strong>Lớp học:</strong> {lop?.tenLop || "N/A"}
                </p>
                <p>
                  <strong>Ngành:</strong> {nganh?.tenNganh || "N/A"}
                </p>
                <p>
                  <strong>Ngày vào trường:</strong>{" "}
                  {lop?.namNhapHoc
                    ? new Date(lop.namNhapHoc, 0, 1).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Form upload ảnh */}
          {sinhVien?.avatar ? null : (
            <div className="mt-4">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Tải ảnh đại diện
              </button>
            </div>
          )}

          {/* Phần thông tin cá nhân và mở rộng (giữ nguyên như trước) */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Thông tin cá nhân
            </h2>
            <div className="grid grid-cols-2 gap-4 text-gray-600">
              <div>
                <p>
                  <strong>Họ tên:</strong> {sinhVien?.hoTen || "N/A"}
                </p>
                <p>
                  <strong>Ngày sinh:</strong>{" "}
                  {sinhVien?.ngaySinh
                    ? new Date(sinhVien.ngaySinh).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Nơi sinh:</strong> {sinhVien?.diaChi || "N/A"}
                </p>
                <p>
                  <strong>Giới tính:</strong> {sinhVien?.gioiTinh || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {sinhVien?.email || "N/A"}
                </p>
                <p>
                  <strong>Mã số thẻ BHYT:</strong>{" "}
                  {sinhVien?.maSoTheBHYT || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Dân tộc:</strong> {sinhVien?.danToc || "N/A"}
                </p>
                <p>
                  <strong>Tôn giáo:</strong> {sinhVien?.tonGiao || "N/A"}
                </p>
                <p>
                  <strong>Số điện thoại:</strong>{" "}
                  {sinhVien?.soDienThoai || "N/A"}
                </p>
                <p>
                  <strong>Trạng thái:</strong> {sinhVien?.trangThai || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Thông tin mở rộng
            </h2>
            <div className="grid grid-cols-2 gap-4 text-gray-600">
              <div>
                <p>
                  <strong>Tên trường THPT tốt nghiệp:</strong>{" "}
                  {sinhVien?.truongTHPT || "N/A"}
                </p>
                <p>
                  <strong>Phường/Xã:</strong> {sinhVien?.phuongXaTHPT || "N/A"}
                </p>
                <p>
                  <strong>Quận/Huyện:</strong>{" "}
                  {sinhVien?.quanHuyenTHPT || "N/A"}
                </p>
                <p>
                  <strong>Tỉnh/Thành phố:</strong>{" "}
                  {sinhVien?.tinhThanhTHPT || "N/A"}
                </p>
                <p>
                  <strong>Năm tốt nghiệp THPT:</strong>{" "}
                  {sinhVien?.namTotNghiepTHPT || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Phường/Xã:</strong>{" "}
                  {sinhVien?.diaChiPhuHuynh || "N/A"}
                </p>
                <p>
                  <strong>Quận/Huyện:</strong> {"N/A"}
                </p>
                <p>
                  <strong>Tỉnh/Thành phố:</strong> {"N/A"}
                </p>
                <p>
                  <strong>Họ tên phụ huynh:</strong>{" "}
                  {sinhVien?.hoTenPhuHuynh || "N/A"}
                </p>
                <p>
                  <strong>Địa chỉ liên hệ phụ huynh:</strong>{" "}
                  {sinhVien?.diaChiPhuHuynh || "N/A"}
                </p>
                <p>
                  <strong>Số điện thoại phụ huynh:</strong>{" "}
                  {sinhVien?.sdtPhuHuynh || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
