import React from "react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

export function FacultySidebar() {
  const [location] = useLocation();

  const navigation = [
    {
      title: "Tổng quan",
      items: [
        { name: "Trang chủ", path: "/faculty/dashboard", icon: "ri-dashboard-line" },
        { name: "Thông tin cá nhân", path: "/faculty/profile", icon: "ri-user-line" }
      ]
    },
    {
      title: "Giảng dạy",
      items: [
        { name: "Lịch giảng dạy", path: "/faculty/schedule", icon: "ri-calendar-line" },
        { name: "Quản lý lớp học", path: "/faculty/classes", icon: "ri-book-open-line" },
        { name: "Quản lý điểm", path: "/faculty/grades", icon: "ri-file-list-3-line" }
      ]
    },
    {
      title: "Nghiên cứu & Tài liệu",
      items: [
        { name: "Tài liệu giảng dạy", path: "/faculty/materials", icon: "ri-folders-line" },
        { name: "Đề thi & Bài tập", path: "/faculty/exams", icon: "ri-file-paper-2-line" },
        { name: "Khóa luận & Đồ án", path: "/faculty/theses", icon: "ri-graduation-cap-line" },
        { name: "Nghiên cứu khoa học", path: "/faculty/research", icon: "ri-flask-line" }
      ]
    }
  ];

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <Logo subtitle="Cổng giảng viên" />
      </div>
      
      <nav className="p-2 overflow-y-auto h-[calc(100vh-70px)]">
        {navigation.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-3 pb-2 px-2">
              {group.title}
            </div>
            {group.items.map((item, itemIndex) => {
              const isActive = location === item.path;
              return (
                <a
                  key={itemIndex}
                  href={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.name}
                </a>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
