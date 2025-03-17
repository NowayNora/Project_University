import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  FileText,
  FolderPlus,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      name: "Điểm danh lớp học",
      icon: <CalendarCheck className="text-xl mr-3" />,
      color: "bg-primary-50 text-primary-700 hover:bg-primary-100",
      path: "/giangvien/diemdanh",
    },
    {
      name: "Nhập điểm",
      icon: <FileText className="text-xl mr-3" />,
      color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
      path: "/giangvien/quanlydiem",
    },
    {
      name: "Tải lên tài liệu",
      icon: <FolderPlus className="text-xl mr-3" />,
      color: "bg-green-50 text-green-700 hover:bg-green-100",
      path: "/giangvien/tailieu",
    },
    {
      name: "Tạo thông báo",
      icon: <MessageSquare className="text-xl mr-3" />,
      color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
      path: "/thongbao",
    },
    {
      name: "Tạo đề thi/kiểm tra",
      icon: <ClipboardList className="text-xl mr-3" />,
      color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
      path: "/giangvien/dethi",
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">
          Thao tác nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <a
              key={index}
              href={action.path}
              className={`flex items-center p-3 rounded-md ${action.color} transition duration-200`}
            >
              {action.icon}
              <span className="font-medium">{action.name}</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
