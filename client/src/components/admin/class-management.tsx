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
import { Pencil, Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for class creation/editing
const classFormSchema = z.object({
  tenLop: z.string().min(1, "Tên lớp không được để trống"),
  maLop: z.string().min(1, "Mã lớp không được để trống"),
  khoaId: z.coerce.number().int().positive("Khoa không hợp lệ"),
  nienKhoa: z.string().min(1, "Niên khóa không được để trống"),
  siSoToiDa: z.coerce.number().int().positive().default(50),
  coVanId: z.coerce.number().int().positive().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

export function ClassManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ["/api/admin/lop"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lop");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ["/api/admin/khoa"],
    queryFn: async () => {
      const res = await fetch("/api/admin/khoa");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  // Fetch faculty for dropdown
  const { data: faculty } = useQuery({
    queryKey: ["/api/admin/giangvien"],
    queryFn: async () => {
      const res = await fetch("/api/admin/giangvien");
      if (!res.ok) throw new Error("Failed to fetch faculty");
      return res.json();
    },
  });

  // Form for adding a new class
  const addForm = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      tenLop: "",
      maLop: "",
      khoaId: 0,
      nienKhoa: "",
      siSoToiDa: 50,
    },
  });

  // Form for editing a class
  const editForm = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      tenLop: "",
      maLop: "",
      khoaId: 0,
      nienKhoa: "",
      siSoToiDa: 50,
    },
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: ClassFormValues) => {
      const res = await fetch("/api/admin/lop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create class");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lop"] });
      toast({
        title: "Thành công",
        description: "Đã tạo lớp mới",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async (data: ClassFormValues & { id: number }) => {
      const { id, ...classData } = data;
      const res = await fetch(`/api/admin/lop/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update class");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lop"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật lớp",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/lop/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete class");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lop"] });
      toast({
        title: "Thành công",
        description: "Đã xóa lớp",
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

  // Handle opening edit dialog
  const handleEdit = (classData: any) => {
    setSelectedClass(classData);
    editForm.reset({
      tenLop: classData.tenLop,
      maLop: classData.maLop,
      khoaId: classData.khoaId,
      nienKhoa: classData.nienKhoa,
      siSoToiDa: classData.siSoToiDa,
      coVanId: classData.coVanId,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa lớp này?")) {
      deleteClassMutation.mutate(id);
    }
  };

  // Handle add form submission
  const onAddSubmit = (data: ClassFormValues) => {
    createClassMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: ClassFormValues) => {
    if (selectedClass) {
      updateClassMutation.mutate({ ...data, id: selectedClass.id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Quản lý lớp học</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm lớp mới
        </Button>
      </div>

      {/* Classes Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã lớp</TableHead>
              <TableHead>Tên lớp</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Niên khóa</TableHead>
              <TableHead>Sĩ số tối đa</TableHead>
              <TableHead>Cố vấn</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes?.map((classItem: any) => (
              <TableRow key={classItem.id}>
                <TableCell>{classItem.maLop}</TableCell>
                <TableCell>{classItem.tenLop}</TableCell>
                <TableCell>
                  {departments?.find((d: any) => d.id === classItem.khoaId)?.tenKhoa || "N/A"}
                </TableCell>
                <TableCell>{classItem.nienKhoa}</TableCell>
                <TableCell>{classItem.siSoToiDa}</TableCell>
                <TableCell>
                  {faculty?.find((f: any) => f.id === classItem.coVanId)?.hoTen || "Chưa có"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(classItem)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(classItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm lớp mới</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="tenLop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên lớp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="maLop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã lớp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mã lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="khoaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khoa</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Chọn khoa</option>
                        {departments?.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.tenKhoa}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nienKhoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niên khóa</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 2023-2027" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="siSoToiDa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sĩ số tối đa</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="coVanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cố vấn học tập</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Chọn cố vấn</option>
                        {faculty?.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.hoTen}
                          </option>
                        ))}
                      </select>
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
                <Button type="submit">Thêm lớp</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lớp</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Same form fields as Add Dialog */}
              <FormField
                control={editForm.control}
                name="tenLop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên lớp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="maLop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã lớp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mã lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="khoaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khoa</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Chọn khoa</option>
                        {departments?.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.tenKhoa}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="nienKhoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niên khóa</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 2023-2027" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="siSoToiDa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sĩ số tối đa</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="coVanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cố vấn học tập</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Chọn cố vấn</option>
                        {faculty?.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.hoTen}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}