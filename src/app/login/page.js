"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session, loading } = useAuth();
  const { theme, toggleTheme, ready } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace("/admin");
  }, [loading, session, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-lightAlt px-4 dark:bg-surface-dark">
      {ready && (
        <button
          onClick={toggleTheme}
          className="absolute right-4 top-4 rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      )}

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo width={280} height={57} priority />
        </div>

        <div className="card p-8">
          <h1 className="mb-1 text-xl font-semibold">Admin Sign In</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Manage tracks, students, and points.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-gdg-red dark:bg-red-950/40">{error}</div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">GDG on Campus CIC — Leaderboard Admin</p>
      </div>
    </div>
  );
}
