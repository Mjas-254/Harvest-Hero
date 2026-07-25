"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import {
  CheckCircle,
  Clock,
  XCircle,
  Wheat,
} from "lucide-react";

interface Harvest {
  _id: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  harvestDate: string;
  status: string;
  submittedAt: string;
  farmId: { name: string } | null;
  photoUrls: string[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  submitted: {
    icon: <Clock size={20} />,
    color: "bg-yellow-100 text-yellow-700",
    label: "Pending review",
  },
  verified: {
    icon: <CheckCircle size={20} />,
    color: "bg-green-100 text-green-700",
    label: "Verified",
  },
  rejected: {
    icon: <XCircle size={20} />,
    color: "bg-red-100 text-red-700",
    label: "Needs attention",
  },
  rewarded: {
    icon: <CheckCircle size={20} />,
    color: "bg-purple-100 text-purple-700",
    label: "Rewarded",
  },
};

export default function HistoryPage() {
  const { token } = useAuth();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<{ data: Harvest[] }>("/farm/harvests", { token })
      .then((res) => setHarvests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">🌾</div>
        <p className="text-gray-500">Loading your harvests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Harvests</h1>
        <p className="text-gray-500 mt-1">
          {harvests.length} harvest{harvests.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {harvests.length === 0 ? (
        <Card className="text-center py-10">
          <Wheat size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">
            No harvests yet. Start by recording your first one!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {harvests.map((h) => {
            const status = statusConfig[h.status] || statusConfig.submitted;
            return (
              <Card key={h._id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{h.cropType}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p className="text-gray-500">
                      {h.quantity} {h.unit} | Grade {h.qualityGrade}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {h.farmId?.name || "Farm"} | {new Date(h.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {h.photoUrls && h.photoUrls.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {h.photoUrls.map((url, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
