import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// Form schema for registration period
const registrationPeriodSchema = z.object({
  hocKy: z.string().min(1, "Học kỳ không được để trống"),
  namHoc: z.string().min(1, "Năm học không được để trống"),
  thoiGianBatDau: z.string().min(1, "Thời gian bắt đầu không được để trống"),
  thoiGianKetThuc: z.string().min(1, "Thời gian kết thúc không được để trống"),
  trangThai: z.enum(["Hoạt động", "Kết thúc", "Chưa bắt đầu"]),
  moTa: z.string().optional(),
});

type RegistrationPeriodFormValues = z.infer<typeof registrationPeriodSchema>;

export function RegistrationPeriodManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch registration periods
  const { data: periods, isLoading } = useQuery({
    queryKey: ["/api/admin/registration-periods"],
    queryFn: async () => {
      const res = await fetch("/api/admin/registration-periods");
      if (!res.ok) throw new Error("Failed to fetch registration periods");
      return res.json();
    },
  });

  // Form for adding a new registration period
  const form = useForm<RegistrationPeriodFormValues>({
    resolver: zodResolver(registrationPeriodSchema),
    defaultValues: {
      hocKy: "",
      namHoc: "",
      thoiGianBatDau: "",
      thoiGianKetThuc: "",
      trangThai: "Chưa bắt đầu",
      moTa: "",
    },
  });

  // Create registration period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async (data: RegistrationPeriodFormValues) => {
      const res = await fetch("/api/admin/registration-periods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error.message || "Failed to create registration period"
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/registration-periods"],
      });
      toast({
        title: "Thành công",
        description: "Đã tạo thời gian đăng ký mới",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update registration period status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/registration-periods/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trangThai: status }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update status");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/registration-periods"],
      });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: RegistrationPeriodFormValues) => {
    // Format datetime strings to ISO format
    const formattedData = {
      ...data,
      thoiGianBatDau: new Date(data.thoiGianBatDau).toISOString(),
      thoiGianKetThuc: new Date(data.thoiGianKetThuc).toISOString(),
    };

    createPeriodMutation.mutate(formattedData);
  };

  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    if (
      status === "Hoạt động" &&
      !confirm(
        "Kích hoạt thời gian đăng ký này sẽ kết thúc các thời gian đăng ký đang hoạt động khác. Bạn có chắc chắn?"
      )
    ) {
      return;
    }

    updateStatusMutation.mutate({ id, status });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hoạt động":
        return <Badge className="bg-green-500">Hoạt động</Badge>;
      case "Kết thúc":
        return <Badge variant="secondary">Kết thúc</Badge>;
      case "Chưa bắt đầu":
        return <Badge variant="outline">Chưa bắt đầu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Quản lý thời gian đăng ký học</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm thời gian đăng ký
        </Button>
      </div>

      {/* Registration Periods Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Năm học</TableHead>
              <TableHead>Thời gian bắt đầu</TableHead>
              <TableHead>Thời gian kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods?.map((period: any) => (
              <TableRow key={period.id}>
                <TableCell>{period.hocKy}</TableCell>
                <TableCell>{period.namHoc}</TableCell>
                <TableCell>{formatDate(period.thoiGianBatDau)}</TableCell>
                <TableCell>{formatDate(period.thoiGianKetThuc)}</TableCell>
                <TableCell>{getStatusBadge(period.trangThai)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {period.trangThai !== "Hoạt động" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(period.id, "Hoạt động")
                        }
                      >
                        <Check className="h-4 w-4 mr-1" /> Kích hoạt
                      </Button>
                    )}
                    {period.trangThai !== "Kết thúc" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(period.id, "Kết thúc")
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" /> Kết thúc
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Registration Period Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm thời gian đăng ký học</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hocKy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Học kỳ</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Chọn học kỳ</option>
                          <option value="Học kỳ 1">Học kỳ 1</option>
                          <option value="Học kỳ 2">Học kỳ 2</option>
                          <option value="Học kỳ hè">Học kỳ hè</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="namHoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Năm học</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 2023-2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="thoiGianBatDau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian bắt đầu</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thoiGianKetThuc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian kết thúc</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trangThai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Kết thúc">Kết thúc</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moTa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập mô tả về thời gian đăng ký học này"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Thêm thời gian đăng ký</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
