"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex">
        <Sidebar />
        {children}
      </div>
    </ProtectedRoute>
  );
}
