import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";
import { StudentSidebar } from "@/components/student/sidebar";
import axios, { AxiosError } from "axios";

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

// Định nghĩa interface cho lịch học của sinh viên
interface ScheduleItem {
  id: number;
  monHocId: number;
  thu: string;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string;
  loaiTiet: string;
  monHoc?: {
    tenMon: string;
  };
}

// Định nghĩa interface cho học kỳ - năm học
interface SemesterYear {
  id: number;
  hocKy: string;
  namHoc: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [registeredCourses, setRegisteredCourses] = useState<
    RegisteredCourse[]
  >([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseInfo, setCourseInfo] = useState<{
    tenMon: string;
    maMon: string;
    soTinChi: number;
  } | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterYear[]>([]);
  const [formData, setFormData] = useState({
    autoSchedule: true,
    hocKy: "",
    namHoc: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [registrationPeriod, setRegistrationPeriod] = useState<{
    isActive: boolean;
    message: string;
    startDate?: string;
    endDate?: string;
  }>({
    isActive: false,
    message: "Đang kiểm tra thời gian đăng ký...",
  });

  // Hàm chuẩn hóa định dạng học kỳ
  const normalizeHocKy = (hocKy: string): string => {
    // Không chuẩn hóa - giữ nguyên giá trị từ database
    return hocKy;
  };

  // Lấy danh sách học kỳ - năm học
  const fetchSemesters = async () => {
    try {
      // Gọi API thực tế thay vì sử dụng dữ liệu hardcoded
      const response = await axios.get<SemesterYear[]>("/api/hocky-namhoc", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Nếu không có API, dùng dữ liệu hardcoded
      if (!response.data || response.data.length === 0) {
        const hardcodedSemesters = [
          {
            id: 1,
            hocKy: "Học kỳ 1",
            namHoc: "2024-2025",
            ngayBatDau: "2024-09-01",
            ngayKetThuc: "2025-01-31",
            trangThai: "Hoạt động",
          },
          {
            id: 2,
            hocKy: "Học kỳ 2",
            namHoc: "2024-2025",
            ngayBatDau: "2025-02-01",
            ngayKetThuc: "2025-06-30",
            trangThai: "Chưa bắt đầu",
          },
        ];
        setSemesters(hardcodedSemesters);
      } else {
        // Chuẩn hóa định dạng học kỳ từ API response
        const normalizedSemesters = response.data.map((semester) => ({
          ...semester,
          hocKy: normalizeHocKy(semester.hocKy),
        }));
        setSemesters(normalizedSemesters);
      }

      // Tự động chọn học kỳ hiện tại
      const currentSemester =
        (response.data?.length > 0
          ? response.data.find((s) => s.trangThai === "Hoạt động")
          : null) ||
        semesters.find((s) => s.trangThai === "Hoạt động") ||
        (semesters.length > 0 ? semesters[0] : null);

      if (currentSemester) {
        setFormData((prev) => ({
          ...prev,
          hocKy: currentSemester.hocKy,
          namHoc: currentSemester.namHoc,
        }));
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      setErrorMessage(
        "Không thể tải danh sách học kỳ. Sử dụng dữ liệu mặc định."
      );

      // Sử dụng dữ liệu mặc định khi không thể gọi API
      const hardcodedSemesters = [
        {
          id: 1,
          hocKy: "Học kỳ 1",
          namHoc: "2024-2025",
          ngayBatDau: "2024-09-01",
          ngayKetThuc: "2025-01-31",
          trangThai: "Hoạt động",
        },
        {
          id: 2,
          hocKy: "Học kỳ 2",
          namHoc: "2024-2025",
          ngayBatDau: "2025-02-01",
          ngayKetThuc: "2025-06-30",
          trangThai: "Chưa bắt đầu",
        },
      ];
      setSemesters(hardcodedSemesters);
      setFormData((prev) => ({
        ...prev,
        hocKy: hardcodedSemesters[0].hocKy,
        namHoc: hardcodedSemesters[0].namHoc,
      }));
    }
  };

  // Lấy danh sách môn học đã đăng ký
  const fetchRegisteredCourses = async () => {
    try {
      const response = await axios.get<RegisteredCourse[]>(
        "/api/sinhvien/dangkyhocphan",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setRegisteredCourses(
        response.data.filter(
          (course) =>
            course.trangThai === "Đã duyệt" || course.trangThai === "Đăng ký"
        )
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching registered courses:", axiosError);
      setErrorMessage("Không thể tải danh sách môn học đã đăng ký.");
    }
  };

  // Lấy thông tin chi tiết môn học
  const fetchCourseDetails = async (courseId: string) => {
    if (!courseId) {
      setCourseInfo(null);
      return;
    }

    const course = registeredCourses.find(
      (c) => c.monHocId.toString() === courseId
    );
    if (course) {
      setCourseInfo({
        tenMon: course.monHoc.tenMon,
        maMon: course.monHoc.maMon,
        soTinChi: course.monHoc.soTinChi,
      });
    }
  };

  // Lấy lịch học hiện tại của sinh viên
  const fetchCurrentSchedule = async () => {
    try {
      // Fix lỗi tính toán ngày đầu tuần
      const startOfWeek = new Date(selectedDate);
      // Điều chỉnh thành thứ Hai của tuần hiện tại
      const day = startOfWeek.getDay(); // 0 = CN, 1 = T2, ...
      const diff = day === 0 ? -6 : 1 - day; // Nếu CN, lùi 6 ngày, còn lại lùi (day-1) ngày
      startOfWeek.setDate(startOfWeek.getDate() + diff);

      console.log("Ngày bắt đầu tuần:", startOfWeek.toLocaleString("vi-VN"));

      const response = await axios.get<ScheduleItem[]>(
        `/api/sinhvien/lichhoc?weekStartDate=${startOfWeek.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("Dữ liệu lịch học:", response.data);
      setScheduleData(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching current schedule:", axiosError);
      setErrorMessage("Không thể tải lịch học hiện tại.");
    }
  };

  // Thực hiện sắp lịch học tự động
  const handleAutoSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!selectedCourseId) {
      setErrorMessage("Vui lòng chọn môn học trước khi sắp lịch tự động.");
      setIsLoading(false);
      return;
    }

    try {
      // Kiểm tra trạng thái đăng ký trước khi thực hiện
      const statusCheck = await axios
        .get(
          `/api/thoigiandangky/status?hocKy=${encodeURIComponent(
            formData.hocKy
          )}&namHoc=${encodeURIComponent(formData.namHoc)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .catch((error) => {
          console.error("Không thể kiểm tra trạng thái đăng ký:", error);
          return {
            data: {
              valid: false,
              message: "Không thể kiểm tra trạng thái đăng ký",
            },
          };
        });

      // Nếu không đang trong thời gian đăng ký, hiển thị thông báo và dừng
      if (statusCheck.data && !statusCheck.data.valid) {
        setErrorMessage(
          statusCheck.data.message || "Ngoài thời gian đăng ký học phần"
        );
        setIsLoading(false);
        return;
      }

      // Tiếp tục nếu đang trong thời gian đăng ký
      // Chuẩn bị payload với đầy đủ thông tin
      const payload = {
        monHocId: parseInt(selectedCourseId),
      };

      console.log("Thông tin chi tiết payload:", JSON.stringify(payload));

      // Gọi API mới để sắp lịch học tự động
      const response = await axios.post(
        "/api/sinhvien/dangky-hocphan-auto",
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("Kết quả sắp lịch:", response.data);

      if (response.data.lichHoc && response.data.lichHoc.length > 0) {
        setSuccessMessage(
          `Đã tạo lịch học tự động thành công cho môn ${courseInfo?.tenMon}! Số lịch đã tạo: ${response.data.lichHoc.length}.`
        );
        fetchCurrentSchedule();
        setStep(3);
      } else {
        setErrorMessage(
          "Không thể tạo lịch học tự động. Hệ thống không tạo được lịch phù hợp."
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Chi tiết lỗi:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      handleSchedulingError(axiosError);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý các loại lỗi từ API
  const handleSchedulingError = (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 400) {
      const errorMessage = error.response.data.message || "";

      if (errorMessage.includes("Ngoài thời gian đăng ký học phần")) {
        setErrorMessage(
          "Hiện đang ngoài thời gian đăng ký học phần. Vui lòng liên hệ với phòng giáo vụ để biết thời gian đăng ký chính xác."
        );
      } else if (
        errorMessage.includes("Already completed") ||
        errorMessage.includes("already completed")
      ) {
        setErrorMessage(
          "Bạn đã đăng ký đủ số tiết cho môn học này. Không cần sắp lịch thêm."
        );
      } else if (errorMessage.includes("No available schedules found")) {
        setErrorMessage(
          "Không tìm thấy lịch học khả dụng cho môn này trong học kỳ được chọn. Vui lòng liên hệ giáo vụ."
        );
      } else if (errorMessage.includes("Invalid semester")) {
        setErrorMessage(
          "Học kỳ hoặc năm học không hợp lệ. Vui lòng kiểm tra lại."
        );
      } else if (errorMessage.includes("Unable to generate")) {
        setErrorMessage(
          "Không thể tạo lịch học tự động vì các lý do sau:\n\n" +
            "1. Xung đột với lịch học hiện tại của bạn\n" +
            "2. Không có đủ slot trống phù hợp với yêu cầu của môn học\n" +
            "3. Các phòng học đã đầy trong khung giờ phù hợp\n\n" +
            "Giải pháp:\n" +
            "- Thử chọn môn học khác\n" +
            "- Liên hệ giáo vụ để được hỗ trợ đăng ký thủ công"
        );
      } else if (errorMessage.includes("Failed to validate")) {
        setErrorMessage(
          "Không thể xác thực yêu cầu sắp lịch. Vui lòng kiểm tra:\n" +
            "1. Bạn đã đăng ký môn học này chưa\n" +
            "2. Bạn có đáp ứng điều kiện tiên quyết không\n" +
            "3. Bạn chưa vượt quá số môn học tối đa cho phép"
        );
      } else {
        setErrorMessage(
          "Không thể tạo lịch học tự động: " +
            (errorMessage || "Vui lòng kiểm tra lại thông tin và thử lại")
        );
      }
    } else if (error.response?.status === 500) {
      setErrorMessage(
        "Lỗi máy chủ khi xử lý yêu cầu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật."
      );
    } else {
      setErrorMessage(
        "Có lỗi khi tạo lịch học tự động. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      );
    }
  };

  // Chuyển bước trong quá trình sắp lịch
  const handleNextStep = () => {
    if (step === 1 && selectedCourseId) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetForm = () => {
    setSelectedCourseId("");
    setCourseInfo(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStep(1);
  };

  // Chuyển tuần để xem lịch
  const handlePreviousWeek = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  // Tính toán ngày trong tuần
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Xử lý khi chọn môn học
  useEffect(() => {
    fetchCourseDetails(selectedCourseId);
  }, [selectedCourseId]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchSemesters();
    fetchRegisteredCourses();
    fetchCurrentSchedule();
  }, [selectedDate]);

  // Thêm hàm kiểm tra thời gian đăng ký
  const checkRegistrationPeriod = async () => {
    try {
      const response = await axios.get(
        `/api/thoigiandangky/status?hocKy=${encodeURIComponent(
          formData.hocKy
        )}&namHoc=${encodeURIComponent(formData.namHoc)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.valid) {
        setRegistrationPeriod({
          isActive: true,
          message: "Đang trong thời gian đăng ký học phần",
          startDate: new Date(
            response.data.period.thoiGianBatDau
          ).toLocaleDateString("vi-VN"),
          endDate: new Date(
            response.data.period.thoiGianKetThuc
          ).toLocaleDateString("vi-VN"),
        });
      } else {
        setRegistrationPeriod({
          isActive: false,
          message: response.data.message || "Ngoài thời gian đăng ký học phần",
        });
      }
    } catch (error) {
      console.error("Không thể kiểm tra thời gian đăng ký:", error);
      setRegistrationPeriod({
        isActive: false,
        message: "Không thể kiểm tra thời gian đăng ký học phần",
      });
    }
  };

  // Thêm useEffect để kiểm tra thời gian đăng ký khi học kỳ/năm học thay đổi
  useEffect(() => {
    if (formData.hocKy && formData.namHoc) {
      checkRegistrationPeriod();
    }
  }, [formData.hocKy, formData.namHoc]);

  // Render màn hình chọn môn học (Bước 1)
  const renderSelectCourse = () => (
    <div className="mb-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        Bước 1: Chọn môn học để sắp lịch tự động
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 whitespace-pre-line">{errorMessage}</p>
        </div>
      )}

      {/* Thêm thông tin về thời gian đăng ký */}
      <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1 flex items-center">
          <InfoIcon className="w-4 h-4 mr-1" /> Thông tin về học kỳ
        </h3>
        <p className="text-xs text-blue-700">
          Lưu ý: Đảm bảo thông tin học kỳ và năm học chính xác để tránh lỗi.
          Định dạng học kỳ phải là "Học kỳ 1", "Học kỳ 2", v.v.
        </p>
      </div>

      {/* Hiển thị thông tin thời gian đăng ký */}
      <div
        className={`p-3 rounded-md border mb-4 ${
          registrationPeriod.isActive
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <h3
          className={`text-sm font-medium mb-1 flex items-center ${
            registrationPeriod.isActive ? "text-green-800" : "text-yellow-800"
          }`}
        >
          <Clock className="w-4 h-4 mr-1" /> Trạng thái đăng ký học phần
        </h3>
        <p
          className={`text-sm ${
            registrationPeriod.isActive ? "text-green-700" : "text-yellow-700"
          }`}
        >
          {registrationPeriod.message}
        </p>
        {registrationPeriod.isActive &&
          registrationPeriod.startDate &&
          registrationPeriod.endDate && (
            <p className="text-xs text-green-600 mt-1">
              Thời gian: {registrationPeriod.startDate} -{" "}
              {registrationPeriod.endDate}
            </p>
          )}
      </div>

      <form>
        <div className="grid grid-cols-2 gap-4">
          {/* Chọn học kỳ */}
          <div>
            <label className="block text-sm font-medium">Học kỳ</label>
            <select
              value={formData.hocKy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hocKy: e.target.value,
                })
              }
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Chọn học kỳ</option>
              {semesters.length > 0 &&
                semesters.map((semester) => (
                  <option key={semester.id} value={semester.hocKy}>
                    {semester.hocKy}
                  </option>
                ))}
            </select>
          </div>

          {/* Chọn năm học */}
          <div>
            <label className="block text-sm font-medium">Năm học</label>
            <select
              value={formData.namHoc}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  namHoc: e.target.value,
                })
              }
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Chọn năm học</option>
              {semesters.length > 0 &&
                semesters
                  .filter(
                    (semester, index, self) =>
                      index ===
                      self.findIndex((s) => s.namHoc === semester.namHoc)
                  )
                  .map((semester) => (
                    <option key={semester.namHoc} value={semester.namHoc}>
                      {semester.namHoc}
                    </option>
                  ))}
            </select>
          </div>

          {/* Chọn môn học đã đăng ký */}
          <div className="col-span-2">
            <label className="block text-sm font-medium">Môn học</label>
            <select
              value={selectedCourseId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedCourseId(e.target.value)
              }
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Chọn môn học để sắp lịch</option>
              {registeredCourses.map((course) => (
                <option key={course.monHocId} value={course.monHocId}>
                  {course.monHoc.tenMon} ({course.monHoc.maMon}) -{" "}
                  {course.monHoc.soTinChi} tín chỉ
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút tiếp tục */}
        <Button
          type="button"
          className="mt-6 w-full"
          disabled={!selectedCourseId || !formData.hocKy || !formData.namHoc}
          onClick={handleNextStep}
        >
          Tiếp tục <span className="ml-2">→</span>
        </Button>
      </form>
    </div>
  );

  // Render màn hình xác nhận (Bước 2)
  const renderConfirmation = () => (
    <div className="mb-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        Bước 2: Xác nhận sắp lịch tự động
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 whitespace-pre-line">{errorMessage}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-800 flex items-center">
          <InfoIcon className="w-5 h-5 mr-2" /> Thông tin môn học
        </h3>
        <div className="mt-2 space-y-2">
          <p>
            <span className="font-medium">Môn học:</span> {courseInfo?.tenMon}
          </p>
          <p>
            <span className="font-medium">Mã môn:</span> {courseInfo?.maMon}
          </p>
          <p>
            <span className="font-medium">Số tín chỉ:</span>{" "}
            {courseInfo?.soTinChi}
          </p>
          <p>
            <span className="font-medium">Học kỳ:</span> {formData.hocKy},{" "}
            {formData.namHoc}
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-yellow-800 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> Lưu ý về sắp lịch tự động
        </h3>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
          <li>Hệ thống sẽ tự động tìm và sắp xếp lịch học phù hợp nhất</li>
          <li>Lịch học sẽ được sắp xếp dựa trên thời gian còn trống của bạn</li>
          <li>Ưu tiên các khung giờ không xung đột với lịch học hiện tại</li>
          <li>
            Hệ thống sẽ phân bổ tiết học lý thuyết và thực hành theo quy định
          </li>
          <li>
            Việc đăng ký sẽ không thể hoàn tác, hãy kiểm tra kỹ trước khi xác
            nhận
          </li>
        </ul>
      </div>

      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-green-800 flex items-center">
          <InfoIcon className="w-5 h-5 mr-2" /> Quy trình tạo lịch tự động
        </h3>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
          <li>Kiểm tra nếu đang trong thời gian đăng ký học phần</li>
          <li>Xác minh số tiết lý thuyết và thực hành cần đăng ký</li>
          <li>Tìm kiếm các lịch học khả dụng không xung đột</li>
          <li>
            Sắp xếp lịch học theo mức độ ưu tiên (buổi học, phòng, thời gian)
          </li>
          <li>Đăng ký các lịch học được chọn và cập nhật lịch học của bạn</li>
        </ol>
      </div>

      <div className="mt-2">
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
          />
          Chỉ xem trước lịch học (không đăng ký)
        </label>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handlePrevStep}>
          <span className="mr-2">←</span> Quay lại
        </Button>
        <Button onClick={handleAutoSchedule} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="spinner mr-2"></div> Đang xử lý...
            </>
          ) : (
            <>Xác nhận sắp lịch tự động</>
          )}
        </Button>
      </div>
    </div>
  );

  // Render màn hình kết quả (Bước 3)
  const renderResult = () => (
    <div className="mb-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Kết quả sắp lịch tự động</h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 whitespace-pre-line">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{successMessage}</p>
          <p className="text-green-600 mt-2">
            Lịch học đã được cập nhật và hiển thị trong thời khóa biểu bên dưới.
          </p>
        </div>
      )}

      <div className="mt-6">
        <Button onClick={resetForm} className="w-full">
          Sắp lịch cho môn học khác
        </Button>
      </div>
    </div>
  );

  // Render component theo bước hiện tại
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderSelectCourse();
      case 2:
        return renderConfirmation();
      case 3:
        return renderResult();
      default:
        return renderSelectCourse();
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="mr-2 h-6 w-6" /> Sắp xếp lịch học tự động
            </h1>
            <p className="text-gray-600 mt-1">
              Hệ thống sẽ tự động sắp xếp lịch học tối ưu cho môn học bạn chọn.
            </p>
          </div>

          {/* Steps indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div
                className={`flex-1 ${
                  step >= 1 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 1 ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  1
                </div>
                <p className="text-sm mt-1">Chọn môn học</p>
              </div>
              <div
                className={`flex-1 border-t-2 ${
                  step >= 2 ? "border-blue-600" : "border-gray-200"
                }`}
              ></div>
              <div
                className={`flex-1 ${
                  step >= 2 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 2 ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  2
                </div>
                <p className="text-sm mt-1">Xác nhận</p>
              </div>
              <div
                className={`flex-1 border-t-2 ${
                  step >= 3 ? "border-blue-600" : "border-gray-200"
                }`}
              ></div>
              <div
                className={`flex-1 ${
                  step >= 3 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 3 ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  3
                </div>
                <p className="text-sm mt-1">Kết quả</p>
              </div>
            </div>
          </div>

          {/* Form content based on current step */}
          {renderStepContent()}

          {/* Weekly Schedule */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="flex justify-between p-4 items-center">
              <Button variant="outline" onClick={handlePreviousWeek}>
                <span className="mr-1">←</span> Tuần trước
              </Button>
              <div className="text-center font-medium">
                <div className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {weekDates[0].toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  -{" "}
                  {weekDates[6].toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>
              </div>
              <Button variant="outline" onClick={handleNextWeek}>
                Tuần sau <span className="ml-1">→</span>
              </Button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-20"></th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="border p-2 text-center">
                      <div className="font-medium">{daysOfWeek[index]}</div>
                      <div className="text-sm text-gray-500">
                        {date.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, rowIndex) => (
                  <tr key={rowIndex} className="border">
                    <td className="border p-2 bg-yellow-50 text-center font-bold">
                      {slot}
                      <div className="text-xs font-normal text-gray-500">
                        {rowIndex === 0
                          ? "Tiết 1-6"
                          : rowIndex === 1
                          ? "Tiết 7-10"
                          : "Tiết 11-12"}
                      </div>
                    </td>
                    {weekDates.map((date, colIndex) => {
                      const scheduleItems = scheduleData.filter((item) => {
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
                        <td
                          key={colIndex}
                          className="border p-2 h-28 align-top"
                        >
                          {scheduleItems.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {scheduleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`${
                                    item.loaiTiet === "lyThuyet"
                                      ? "bg-green-100 border-green-300"
                                      : "bg-blue-100 border-blue-300"
                                  } p-2 rounded border text-sm transition-all hover:shadow-md`}
                                >
                                  <p className="font-medium truncate">
                                    {item.monHoc?.tenMon || "Unknown Course"}
                                  </p>
                                  <div className="flex items-center text-xs mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Tiết {item.tietBatDau}-
                                    {item.tietBatDau + item.soTiet - 1}
                                  </div>
                                  <div className="flex items-center text-xs mt-1">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {item.loaiTiet === "lyThuyet"
                                      ? "Lý thuyết"
                                      : "Thực hành"}
                                  </div>
                                  <div className="text-xs mt-1 truncate">
                                    Phòng: {item.phongHoc}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span className="text-sm">Lý thuyết</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                  <span className="text-sm">Thực hành</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Thêm IconComponent cho InfoIcon
const InfoIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
