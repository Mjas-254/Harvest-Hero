"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Card, { StatCard } from "@/components/Card";
import {
  Wheat,
  CheckCircle,
  Clock,
  Trophy,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface FarmerDashboard {
  totalHarvests: number;
  verifiedHarvests: number;
  pendingHarvests: number;
  totalPoints: number;
  farms: number;
}

interface VerifierDashboard {
  pending: number;
  verifiedToday: number;
  totalFarmers: number;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [farmerData, setFarmerData] = useState<FarmerDashboard | null>(null);
  const [verifierData, setVerifierData] = useState<VerifierDashboard | null>(null);

  useEffect(() => {
    if (!token) return;
    const endpoint =
      user?.role === "verifier" || user?.role === "admin"
        ? "/farm/dashboard/verifier"
        : "/farm/dashboard/farmer";
    api<{ data: FarmerDashboard | VerifierDashboard }>(endpoint, { token })
      .then((res) => {
        if (user?.role === "farmer") setFarmerData(res.data as FarmerDashboard);
        else setVerifierData(res.data as VerifierDashboard);
      })
      .catch(console.error);
  }, [token, user?.role]);

  const isVerifier = user?.role === "verifier" || user?.role === "admin";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isVerifier ? "Verifier Dashboard" : "My Farm"}
        </h1>
        <p className="text-gray-500 mt-1">
          {isVerifier
            ? "Review and verify harvest submissions"
            : `Welcome back, ${user?.name}!`}
        </p>
      </div>

      {isVerifier ? (
        verifierData && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Needs Review"
              value={verifierData.pending}
              icon={<Clock size={22} />}
              color="earth"
            />
            <StatCard
              label="Verified Today"
              value={verifierData.verifiedToday}
              icon={<CheckCircle size={22} />}
              color="harvest"
            />
            <div className="col-span-2">
              <StatCard
                label="Total Farmers"
                value={verifierData.totalFarmers}
                icon={<Wheat size={22} />}
                color="blue"
              />
            </div>
          </div>
        )
      ) : (
        farmerData && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Harvests"
                value={farmerData.totalHarvests}
                icon={<Wheat size={22} />}
                color="harvest"
              />
              <StatCard
                label="Verified"
                value={farmerData.verifiedHarvests}
                icon={<CheckCircle size={22} />}
                color="blue"
              />
              <StatCard
                label="Pending"
                value={farmerData.pendingHarvests}
                icon={<Clock size={22} />}
                color="earth"
              />
              <StatCard
                label="Points"
                value={farmerData.totalPoints}
                icon={<Trophy size={22} />}
                color="purple"
              />
            </div>

            <Link href="/submit">
              <Card className="bg-harvest-600 text-white flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Record a Harvest</p>
                  <p className="text-harvest-100 text-sm">
                    Log what you picked today
                  </p>
                </div>
                <Plus size={28} />
              </Card>
            </Link>
          </>
        )
      )}

      {isVerifier && (
        <Link href="/verify">
          <Card className="bg-harvest-600 text-white flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Review Harvests</p>
              <p className="text-harvest-100 text-sm">
                Verify farmer submissions
              </p>
            </div>
            <ArrowRight size={28} />
          </Card>
        </Link>
      )}

      <Card className="bg-earth-50 border-earth-200">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <p className="font-semibold text-earth-800">
              {isVerifier
                ? "Tip: Check photos and quantity before approving"
                : "Tip: Add photos of your harvest for faster verification!"}
            </p>
            <p className="text-sm text-earth-600 mt-1">
              {isVerifier
                ? "Verified harvests earn points for farmers and build trust in the supply chain."
                : "Verified harvests earn you points that unlock rewards."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
