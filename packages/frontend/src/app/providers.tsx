"use client";

import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

const PUBLIC_PATHS = ["/login", "/register"];

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  const shouldRedirectToLogin = !loading && !user && !isPublic;
  const shouldRedirectToDashboard = !loading && !!user && !isPublic && pathname === "/";

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    } else if (shouldRedirectToDashboard) {
      router.replace("/dashboard");
    }
  }, [shouldRedirectToLogin, shouldRedirectToDashboard, router]);

  if (loading || shouldRedirectToLogin || shouldRedirectToDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-harvest-500 to-harvest-700">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🌾</div>
          <p className="text-lg opacity-80">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublic || !user) return <>{children}</>;

  return <AppLayout>{children}</AppLayout>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
