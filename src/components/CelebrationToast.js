"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function CelebrationToast({ message, onDismiss, duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-xl border border-gdg-yellow/40 bg-white px-4 py-3 shadow-lg dark:bg-surface-darkAlt animate-[slideUp_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
