"use client";

import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`card w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-y-auto p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
