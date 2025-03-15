import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Login schema
const loginSchema = z.object({
  tenDangNhap: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("student");
  const [formMode, setFormMode] = useState<"login" | "register">("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User data:", user);
      console.log("Role:", user.role);
      if (user.role === "student") {
        navigate("/student/dashboard");
      } else if (user.role === "faculty") {
        navigate("/faculty/dashboard");
      }
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenDangNhap: "",
      password: "",
    },
  });

  const handleLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    console.log("Login data:", values);
    loginMutation.mutate(values);
  };

  // Switch role (student/faculty)
  const handleRoleChange = (role: string) => {
    setActiveTab(role);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side: University background image */}
      <div
        className="login-bg hidden md:block bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
        }}
      ></div>

      {/* Right side: Login form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* University Logo */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
              <i className="ri-building-4-line mr-2 text-4xl"></i>
              ĐẠI HỌC XYZ
            </h1>
            <p className="text-gray-600 mt-2">Hệ thống Quản lý Đào tạo</p>
          </div>

          {/* Login/Register tabs & forms */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Tabs
              defaultValue="student"
              value={activeTab}
              onValueChange={handleRoleChange}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger
                  value="student"
                  className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Sinh viên
                </TabsTrigger>
                <TabsTrigger
                  value="faculty"
                  className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Giảng viên
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="p-6">
                {formMode === "login" ? (
                  <>
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="tenDangNhap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên đăng nhập</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nhập tên đăng nhập"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Nhập mật khẩu"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Đăng nhập
                        </Button>
                      </form>
                    </Form>
                  </>
                ) : (
                  <></>
                )}
              </TabsContent>

              <TabsContent value="faculty" className="p-6">
                {formMode === "login" ? (
                  <>
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="tenDangNhap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên đăng nhập</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nhập tên đăng nhập"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Nhập mật khẩu"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                              <div className="flex justify-end mt-1">
                                <a
                                  href="#"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Quên mật khẩu?
                                </a>
                              </div>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Đăng nhập
                        </Button>
                      </form>
                    </Form>
                  </>
                ) : (
                  <></>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>&copy; 2023 Đại học XYZ. Mọi quyền được bảo lưu.</p>
            <p className="mt-2">
              Hỗ trợ kỹ thuật:{" "}
              <a
                href="mailto:support@xyz-uni.edu.vn"
                className="text-primary hover:underline"
              >
                support@xyz-uni.edu.vn
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
