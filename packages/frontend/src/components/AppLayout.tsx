"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  Home,
  Plus,
  History,
  Award,
  LogOut,
  CheckCircle,
  Scan,
  BookOpen,
} from "lucide-react";

const farmerNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/submit", label: "Add Harvest", icon: Plus },
  { href: "/history", label: "History", icon: History },
  { href: "/education", label: "Learn", icon: BookOpen },
  { href: "/rewards", label: "Rewards", icon: Award },
];

const verifierNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/verify", label: "Review", icon: CheckCircle },
  { href: "/trace", label: "Trace", icon: Scan },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = user?.role === "verifier" || user?.role === "admin"
    ? verifierNav
    : farmerNav;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-harvest-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span>Harvest Hero</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80 hidden sm:inline">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="p-2 hover:bg-harvest-700 rounded-lg transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 sm:pb-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1 text-gray-500 hover:text-harvest-600 transition-colors"
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
