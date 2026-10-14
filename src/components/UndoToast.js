"use client";

import { useEffect, useState } from "react";
import { Undo2, X } from "lucide-react";

// Shows a bottom-center toast for `duration` ms with an Undo button.
export default function UndoToast({ message, onUndo, onDismiss, duration = 6000 }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-surface-darkAlt animate-[slideUp_0.25s_ease-out]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm">{message}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onUndo} className="flex items-center gap-1 rounded-lg bg-gdg-blue px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600">
            <Undo2 size={12} /> Undo
          </button>
          <button onClick={onDismiss} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="h-1 bg-gray-100 dark:bg-gray-800">
        <div className="h-full bg-gdg-blue transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
