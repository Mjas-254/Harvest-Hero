"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Select from "@/components/Select";
import { CheckCircle, XCircle, Eye, User, MapPin } from "lucide-react";

interface PendingHarvest {
  _id: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  harvestDate: string;
  notes: string;
  photoUrls: string[];
  submittedAt: string;
  farmerId: { name: string; phone: string } | null;
  farmId: { name: string; location: string } | null;
}

export default function VerifyPage() {
  const { token } = useAuth();
  const [harvests, setHarvests] = useState<PendingHarvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingHarvest | null>(null);
  const [gradeOverride, setGradeOverride] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchPending = () => {
    if (!token) return;
    api<{ data: PendingHarvest[] }>("/farm/verifier/pending", { token })
      .then((res) => setHarvests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, [token]);

  const handleVerify = async (approved: boolean) => {
    if (!selected || !token) return;
    setProcessing(true);
    try {
      await api("/farm/verifier/verify", {
        method: "POST",
        token,
        body: {
          harvestId: selected._id,
          approved,
          qualityGrade: gradeOverride || undefined,
          rejectionReason: approved ? undefined : rejectReason,
        },
      });
      setHarvests((prev) => prev.filter((h) => h._id !== selected._id));
      setSelected(null);
      setGradeOverride("");
      setRejectReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">✅</div>
        <p className="text-gray-500">Loading harvests to review...</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-harvest-600 font-semibold text-sm"
        >
          Back to list
        </button>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{selected.cropType}</h2>
              <p className="text-gray-500">
                {selected.quantity} {selected.unit} | Grade {selected.qualityGrade}
              </p>
            </div>

            {selected.farmerId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span>{selected.farmerId.name}</span>
                <span className="text-gray-400">|</span>
                <span>{selected.farmerId.phone}</span>
              </div>
            )}

            {selected.farmId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} />
                <span>
                  {selected.farmId.name} - {selected.farmId.location}
                </span>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Harvested: {new Date(selected.harvestDate).toLocaleDateString()}</p>
              <p>Submitted: {new Date(selected.submittedAt).toLocaleString()}</p>
            </div>

            {selected.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600">{selected.notes}</p>
              </div>
            )}

            {selected.photoUrls.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {selected.photoUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setViewingPhoto(url)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                    >
                      <img
                        src={url}
                        alt={`Harvest photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Select
              label="Override quality grade (optional)"
              value={gradeOverride}
              onChange={(e) => setGradeOverride(e.target.value)}
              options={[
                { value: "", label: "Keep original (Grade " + selected.qualityGrade + ")" },
                { value: "A", label: "A - Premium quality" },
                { value: "B", label: "B - Good quality" },
                { value: "C", label: "C - Standard quality" },
              ]}
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            size="lg"
            onClick={() => {
              setRejectReason("");
              setShowRejectModal(true);
            }}
          >
            <XCircle size={20} className="inline mr-1" />
            Reject
          </Button>
          <Button
            variant="success"
            className="flex-1"
            size="lg"
            onClick={() => handleVerify(true)}
            loading={processing}
          >
            <CheckCircle size={20} className="inline mr-1" />
            Verify
          </Button>
        </div>

        {viewingPhoto && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setViewingPhoto(null)}
          >
            <img
              src={viewingPhoto}
              alt="Full size"
              className="max-w-full max-h-full rounded-xl"
            />
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Reject Harvest</h3>
              <p className="text-sm text-gray-500">
                Please tell the farmer why this harvest is being rejected so they can improve.
              </p>
              <textarea
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none resize-none text-base"
                rows={3}
                placeholder="e.g. Photos are unclear, quantity doesn't match..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={processing}
                  onClick={() => {
                    handleVerify(false);
                    setShowRejectModal(false);
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Harvests</h1>
        <p className="text-gray-500 mt-1">
          {harvests.length} harvest{harvests.length !== 1 ? "s" : ""} waiting
        </p>
      </div>

      {harvests.length === 0 ? (
        <Card className="text-center py-10">
          <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-gray-500 text-lg">All caught up! No pending harvests.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {harvests.map((h) => (
            <Card
              key={h._id}
              onClick={() => setSelected(h)}
              className="active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{h.cropType}</h3>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {h.farmerId?.name || "Farmer"} | {h.quantity} {h.unit}
                  </p>
                  <p className="text-xs text-gray-400">
                    {h.farmId?.name || "Farm"} | Grade {h.qualityGrade}
                  </p>
                </div>
                <Eye size={20} className="text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
