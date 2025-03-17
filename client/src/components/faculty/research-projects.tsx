import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho đề tài nghiên cứu
interface ResearchProject {
  id: number;
  maDeTai?: string;
  tenDeTai: string;
  vaiTro?: string;
  soThanhVien?: number;
  thoiGianBatDau: string;
  thoiGianKetThuc?: string;
  trangThai: string;
  tienDo?: number;
}

export function ResearchProjects() {
  const { data: projects, isLoading } = useQuery<ResearchProject[]>({
    queryKey: ["/api/nghiencuu"],
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case "planning":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Lập kế hoạch ({progress}%)
          </span>
        );
      case "ongoing":
      case "Đang thực hiện":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Đang thực hiện ({progress}%)
          </span>
        );
      case "completed":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Hoàn thành (100%)
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status} ({progress}%)
          </span>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">
          Đề tài nghiên cứu đang thực hiện
        </CardTitle>
        <Button variant="outline" size="sm" className="text-primary h-8">
          <PlusCircle className="h-4 w-4 mr-1" />
          Thêm mới
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-medium text-xs uppercase">
                Mã đề tài
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Tên đề tài
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Vai trò
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Thành viên
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Thời gian
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : projects && projects.length > 0 ? (
              projects.map((project, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="text-sm font-medium text-gray-900">
                    {project.maDeTai || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-md">
                    {project.tenDeTai}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {project.vaiTro || "Chủ nhiệm"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {project.soThanhVien || 0} người
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(project.thoiGianBatDau)} -{" "}
                    {project.thoiGianKetThuc
                      ? formatDate(project.thoiGianKetThuc)
                      : "Hiện tại"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {getStatusBadge(project.trangThai, project.tienDo || 75)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  <p className="text-gray-500">
                    Không có đề tài nghiên cứu nào
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Tạo đề tài mới
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
