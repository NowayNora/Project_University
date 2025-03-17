import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, UserCheck, FolderPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Định nghĩa kiểu dữ liệu cho lớp học
interface ClassItem {
  id: number;
  monHoc: {
    maMonHoc: string;
    tenMonHoc: string;
    khoa?: string;
  };
  lop: string;
  thu: string;
  tietBatDau: string;
  progress?: number;
}

export function ClassesTable() {
  const { data: classes, isLoading } = useQuery<ClassItem[]>({
    queryKey: ["/api/giangvien/lichgiangday"],
  });

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">
          Lớp đang giảng dạy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-medium text-xs uppercase">
                Mã lớp
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Tên môn học
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Lớp
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Thời gian
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Tiến độ
              </TableHead>
              <TableHead className="font-medium text-xs uppercase">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : classes && classes.length > 0 ? (
              classes.map((classItem, index) => {
                const progressPercentage =
                  classItem.progress || Math.floor(Math.random() * 70 + 30);
                const completedSessions = Math.round(
                  (progressPercentage / 100) * 20
                );
                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-900">
                      {classItem.monHoc?.maMonHoc || "N/A"}.
                      {classItem.monHoc?.khoa || "CNTT"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {classItem.monHoc?.tenMonHoc || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {classItem.lop || "CNTT2021"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {classItem.thu && classItem.tietBatDau
                        ? `${classItem.thu}, ${classItem.tietBatDau}`
                        : "Thứ 2, 7:30-9:00"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {completedSessions}/20 buổi
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Quản lý điểm</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-800"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Điểm danh</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-purple-600 hover:text-purple-800"
                              >
                                <FolderPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Tải tài liệu</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  <p className="text-gray-500">
                    Không có lớp giảng dạy nào trong học kỳ hiện tại
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
