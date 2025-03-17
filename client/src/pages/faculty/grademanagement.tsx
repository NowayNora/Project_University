import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FacultySidebar } from "@/components/faculty/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Định nghĩa kiểu dữ liệu
interface MonHoc {
  id: number;
  maMonHoc: string;
  tenMonHoc: string;
}

interface Lop {
  id: number;
  maLop: string;
  tenLop: string;
  soLuongSinhVien: number;
  monHoc: MonHoc[];
}

interface SinhVien {
  id: number;
  maSv: string;
  hoTen: string;
  email?: string;
}

interface ClassDetails {
  lop: Lop;
  sinhVien: SinhVien[];
  monHoc: MonHoc[];
  soLuongSinhVien: number;
}

interface Grade {
  sinhVienId: number;
  monHocId: number;
  diemChuyenCan?: number;
  diemGiuaKy?: number;
  diemCuoiKy?: number;
  diemTongKet?: number;
  hocKy: string;
  namHoc: string;
}

// Hàm fetch dữ liệu từ API
const fetchManagedClasses = async (): Promise<Lop[]> => {
  const response = await fetch("/api/giangvien/lophoc", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch managed classes");
  return response.json();
};

const fetchClassDetails = async (lopId: number): Promise<ClassDetails> => {
  const response = await fetch(`/api/giangvien/lophoc/${lopId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch class details");
  return response.json();
};

const saveGrades = async (grades: Grade): Promise<void> => {
  const response = await fetch("/api/giangvien/quanlydiem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(grades),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to save grades");
  }
};

export function GradeManagement() {
  const [selectedClass, setSelectedClass] = useState<Lop | null>(null);
  const [grades, setGrades] = useState<Record<number, Partial<Grade>>>({});
  const [selectedMonHocId, setSelectedMonHocId] = useState<number | null>(null);
  const [hocKy, setHocKy] = useState<string>("HK1"); // Mặc định học kỳ
  const [namHoc, setNamHoc] = useState<string>("2024-2025"); // Mặc định năm học
  const queryClient = useQueryClient();

  // Query để lấy danh sách lớp
  const { data: classes, isLoading: classesLoading } = useQuery<Lop[]>({
    queryKey: ["managedClasses"],
    queryFn: fetchManagedClasses,
  });

  // Query để lấy chi tiết lớp khi chọn
  const { data: classDetails, isLoading: detailsLoading } =
    useQuery<ClassDetails>({
      queryKey: ["classDetails", selectedClass?.id],
      queryFn: () => fetchClassDetails(selectedClass!.id),
      enabled: !!selectedClass,
    });

  // Mutation để lưu điểm
  const saveGradesMutation = useMutation({
    mutationFn: saveGrades,
    onSuccess: () => {
      alert("Grades saved successfully");
      setGrades({}); // Reset grades sau khi lưu
    },
    onError: (error: Error) => {
      alert(`Error saving grades: ${error.message}`);
    },
  });

  // Xử lý thay đổi điểm
  const handleGradeChange = (
    sinhVienId: number,
    field: keyof Grade,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) return;

    setGrades((prev) => ({
      ...prev,
      [sinhVienId]: {
        ...prev[sinhVienId],
        sinhVienId,
        monHocId: selectedMonHocId!,
        hocKy,
        namHoc,
        [field]: numValue,
      },
    }));
  };

  // Lưu tất cả điểm
  const handleSaveGrades = () => {
    if (!selectedMonHocId) {
      alert("Please select a course");
      return;
    }
    const gradesToSave = Object.values(grades).filter(
      (g): g is Grade => g.sinhVienId !== undefined && g.monHocId !== undefined
    );
    if (gradesToSave.length === 0) {
      alert("No grades to save");
      return;
    }
    gradesToSave.forEach((grade) => saveGradesMutation.mutate(grade));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <FacultySidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý điểm</h1>
            <p className="mt-1 text-sm text-gray-600">
              Nhập và quản lý điểm cho các lớp học
            </p>
          </div>

          {/* Managed Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách lớp học</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Số sinh viên</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : classes && classes.length > 0 ? (
                    classes.map((lop) => (
                      <TableRow key={lop.id}>
                        <TableCell>{lop.maLop || "N/A"}</TableCell>
                        <TableCell>{lop.tenLop || "N/A"}</TableCell>
                        <TableCell>{lop.soLuongSinhVien || 0}</TableCell>
                        <TableCell>
                          {lop.monHoc
                            ?.map((m: MonHoc) => m.tenMonHoc)
                            .join(", ") || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClass(lop)}
                          >
                            Nhập điểm
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Không có lớp học nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Grade Input Dialog */}
          {selectedClass && (
            <Dialog
              open={!!selectedClass}
              onOpenChange={() => {
                setSelectedClass(null);
                setGrades({});
                setSelectedMonHocId(null);
              }}
            >
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>
                    Nhập điểm cho lớp: {selectedClass.tenLop || "N/A"}
                  </DialogTitle>
                </DialogHeader>
                {detailsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : classDetails ? (
                  <div className="space-y-4">
                    {/* Chọn môn học */}
                    <div>
                      <Label htmlFor="monHoc">Chọn môn học</Label>
                      <Select
                        onValueChange={(value) =>
                          setSelectedMonHocId(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn môn học" />
                        </SelectTrigger>
                        <SelectContent>
                          {classDetails.monHoc.map((m) => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              {m.tenMonHoc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chọn học kỳ và năm học */}
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="hocKy">Học kỳ</Label>
                        <Select onValueChange={setHocKy} defaultValue="HK1">
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học kỳ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HK1">HK1</SelectItem>
                            <SelectItem value="HK2">HK2</SelectItem>
                            <SelectItem value="HK3">HK3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="namHoc">Năm học</Label>
                        <Input
                          id="namHoc"
                          value={namHoc}
                          onChange={(e) => setNamHoc(e.target.value)}
                          placeholder="VD: 2024-2025"
                        />
                      </div>
                    </div>

                    {/* Bảng nhập điểm */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã SV</TableHead>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Chuyên cần</TableHead>
                          <TableHead>Giữa kỳ</TableHead>
                          <TableHead>Cuối kỳ</TableHead>
                          <TableHead>Tổng kết</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classDetails.sinhVien.map((sv: SinhVien) => (
                          <TableRow key={sv.id}>
                            <TableCell>{sv.maSv}</TableCell>
                            <TableCell>{sv.hoTen}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={
                                  grades[sv.id]?.diemChuyenCan?.toString() || ""
                                }
                                onChange={(e) =>
                                  handleGradeChange(
                                    sv.id,
                                    "diemChuyenCan",
                                    e.target.value
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={
                                  grades[sv.id]?.diemGiuaKy?.toString() || ""
                                }
                                onChange={(e) =>
                                  handleGradeChange(
                                    sv.id,
                                    "diemGiuaKy",
                                    e.target.value
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={
                                  grades[sv.id]?.diemCuoiKy?.toString() || ""
                                }
                                onChange={(e) =>
                                  handleGradeChange(
                                    sv.id,
                                    "diemCuoiKy",
                                    e.target.value
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={
                                  grades[sv.id]?.diemTongKet?.toString() || ""
                                }
                                onChange={(e) =>
                                  handleGradeChange(
                                    sv.id,
                                    "diemTongKet",
                                    e.target.value
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Nút lưu */}
                    <Button onClick={handleSaveGrades}>Lưu điểm</Button>
                  </div>
                ) : (
                  <p>Không có dữ liệu</p>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default GradeManagement;
