import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FacultySidebar } from "@/components/faculty/sidebar";
import { TeachingSchedule } from "@/components/faculty/teaching-schedule";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Users } from "lucide-react";

// Định nghĩa kiểu dữ liệu dựa trên schema và API response
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

// Hàm fetch dữ liệu từ API với TypeScript
const fetchManagedClasses = async (): Promise<Lop[]> => {
  const response = await fetch("/api/giangvien/lophoc", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Giả định có token
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

export function TeachingPage() {
  const [selectedClass, setSelectedClass] = useState<Lop | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
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

  // Hàm thêm sinh viên vào lớp
  const handleAddStudent = async () => {
    if (!selectedClass) return;
    try {
      const response = await fetch(
        `/api/giangvien/lophoc/${selectedClass.id}/sinhvien`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ sinhVienId: parseInt(newStudentId) }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add student");
      }
      setIsAddStudentOpen(false);
      setNewStudentId("");
      // Refetch dữ liệu chi tiết lớp với cú pháp đúng
      queryClient.invalidateQueries({
        queryKey: ["classDetails", selectedClass.id],
      });
    } catch (error) {
      // Ép kiểu error thành Error để truy cập message
      console.error("Error adding student:", error);
      alert(`Error adding student: ${(error as Error).message}`);
    }
  };

  // Hàm xóa sinh viên khỏi lớp
  const handleRemoveStudent = async (sinhVienId: number) => {
    if (!selectedClass) return;
    try {
      const response = await fetch(
        `/api/giangvien/lophoc/${selectedClass.id}/sinhvien/${sinhVienId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove student");
      }
      // Refetch dữ liệu chi tiết lớp với cú pháp đúng
      queryClient.invalidateQueries({
        queryKey: ["classDetails", selectedClass.id],
      });
    } catch (error) {
      // Ép kiểu error thành Error để truy cập message
      console.error("Error removing student:", error);
      alert(`Error removing student: ${(error as Error).message}`);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý lớp học
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Xem và quản lý các lớp học bạn phụ trách
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
                            <Users className="h-4 w-4 mr-2" />
                            Xem chi tiết
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

          {/* Class Details Dialog */}
          {selectedClass && (
            <Dialog
              open={!!selectedClass}
              onOpenChange={() => setSelectedClass(null)}
            >
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Chi tiết lớp: {selectedClass.tenLop || "N/A"}
                  </DialogTitle>
                </DialogHeader>
                {detailsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : classDetails ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Danh sách sinh viên</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã SV</TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classDetails.sinhVien.map((sv: SinhVien) => (
                            <TableRow key={sv.id}>
                              <TableCell>{sv.maSv}</TableCell>
                              <TableCell>{sv.hoTen}</TableCell>
                              <TableCell>{sv.email || "N/A"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStudent(sv.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <Button onClick={() => setIsAddStudentOpen(true)}>
                        Thêm sinh viên
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p>Không có dữ liệu</p>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Add Student Dialog */}
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm sinh viên vào lớp</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentId">Mã sinh viên</Label>
                  <Input
                    id="studentId"
                    value={newStudentId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewStudentId(e.target.value)
                    }
                    placeholder="Nhập mã sinh viên"
                  />
                </div>
                <Button onClick={handleAddStudent}>Thêm</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Teaching Schedule */}
          <TeachingSchedule limit={5} showViewAll={false} />
        </div>
      </div>
    </div>
  );
}

export default TeachingPage;
