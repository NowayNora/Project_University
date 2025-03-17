import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { StudentSidebar } from "@/components/student/sidebar";

const makeOnlinePayment = async (paymentData: {
  soTien: number;
  phuongThuc: string;
}) => {
  const res = await fetch("/api/sinhvien/thanhtoantructuyen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Lỗi thanh toán trực tuyến");
  }
  return res.json();
};

export default function PaymentPage() {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("VNPay");

  const paymentMutation = useMutation({
    mutationFn: makeOnlinePayment,
    onSuccess: (data) => {
      window.location.href = data.paymentUrl; // Chuyển hướng tới trang thanh toán
    },
    onError: (error) => {
      alert(`Lỗi thanh toán: ${error.message}`);
    },
  });

  const handlePayment = () => {
    if (amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    paymentMutation.mutate({ soTien: amount, phuongThuc: method });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 flex-shrink-0">
        <StudentSidebar />
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Thanh toán trực tuyến</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Số tiền (VND)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 p-2 w-full border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Phương thức thanh toán
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md"
            >
              <option value="VNPay">VNPay</option>
              <option value="Momo">Momo</option>
              <option value="Stripe">Stripe</option>
            </select>
          </div>
          <button
            onClick={handlePayment}
            disabled={paymentMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {paymentMutation.isPending ? "Đang xử lý..." : "Thanh toán ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
