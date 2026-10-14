"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LayoutDashboard, GitBranch, Users, LogOut, Sun, Moon, ExternalLink, History as HistoryIcon, Tv } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tracks", label: "Tracks", icon: GitBranch },
  { href: "/admin/students", label: "Students & Points", icon: Users },
  { href: "/admin/history", label: "History", icon: HistoryIcon },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-surface-darkAlt">
      <div className="flex items-center border-b border-gray-100 px-5 py-5 dark:border-gray-800">
        <Logo width={170} height={35} priority />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-gdg-blue/10 text-gdg-blue" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ExternalLink size={18} />
          View Public Leaderboard
        </a>
        <a
          href="/display"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Tv size={18} />
          Display Mode
        </a>
      </nav>

      <div className="border-t border-gray-100 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
          <p className="text-sm font-medium">Admin</p>
          <button onClick={toggleTheme} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="Toggle theme">
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
