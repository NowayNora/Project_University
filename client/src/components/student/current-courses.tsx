import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export function CurrentCourses() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["/api/student/enrollments"],
  });

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Môn học hiện tại</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-medium text-xs uppercase">Mã môn</TableHead>
              <TableHead className="font-medium text-xs uppercase">Tên môn học</TableHead>
              <TableHead className="font-medium text-xs uppercase">Giảng viên</TableHead>
              <TableHead className="font-medium text-xs uppercase">Tín chỉ</TableHead>
              <TableHead className="font-medium text-xs uppercase">Quá trình</TableHead>
              <TableHead className="font-medium text-xs uppercase">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))
            ) : enrollments && enrollments.length > 0 ? (
              enrollments.map((enrollment: any, index: number) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="text-sm font-medium text-gray-900">
                    {enrollment.course?.courseCode || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {enrollment.course?.courseName || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    GV. {enrollment.facultyName || "..."}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {enrollment.course?.credits || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="w-full">
                      <Progress 
                        value={enrollment.progress || 50} 
                        className="h-2.5 bg-gray-200" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {enrollment.status === "enrolled" ? "Đang học" : enrollment.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  <p className="text-gray-500">Không có môn học nào trong học kỳ hiện tại</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
