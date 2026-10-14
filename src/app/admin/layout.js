"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-surface-darkAlt md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu size={22} />
          </button>

          <span className="text-sm font-semibold">Admin Dashboard</span>
        </header>

        <div className="flex min-h-screen">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            />
          )}

          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}