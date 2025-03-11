import React from "react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

export function StudentSidebar() {
  const [location] = useLocation();

  const navigation = [
    {
      title: "Tổng quan",
      items: [
        { name: "Trang chủ", path: "/student/dashboard", icon: "ri-dashboard-line" },
        { name: "Thông tin cá nhân", path: "/student/profile", icon: "ri-user-line" }
      ]
    },
    {
      title: "Học tập",
      items: [
        { name: "Lịch học", path: "/student/schedule", icon: "ri-calendar-line" },
        { name: "Đăng ký học phần", path: "/student/enrollment", icon: "ri-book-mark-line" },
        { name: "Kết quả học tập", path: "/student/grades", icon: "ri-bar-chart-line" },
        { name: "Chương trình đào tạo", path: "/student/curriculum", icon: "ri-list-check" }
      ]
    },
    {
      title: "Tài chính",
      items: [
        { name: "Học phí", path: "/student/tuition", icon: "ri-money-dollar-circle-line" },
        { name: "Thanh toán trực tuyến", path: "/student/payment", icon: "ri-bank-card-line" }
      ]
    }
  ];

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <Logo subtitle="Cổng sinh viên" />
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
