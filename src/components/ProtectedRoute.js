"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-lightAlt dark:bg-surface-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gdg-blue border-t-transparent" />
      </div>
    );
  }

  return children;
}
