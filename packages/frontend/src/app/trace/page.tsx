"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Scan, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";

interface OnChainData {
  tokenId: number;
  farmer: string;
  verified: boolean;
  rewardMinted: boolean;
  createdAt: number;
}

interface HarvestData {
  _id: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  harvestDate: string;
  status: string;
  submittedAt: string;
  blockchainTxHash?: string;
  tokenId?: number;
  farmerId: { name: string } | null;
  farmId: { name: string; location: string } | null;
}

interface TraceResult {
  harvest: HarvestData;
  onChain: OnChainData | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  submitted: { icon: <Clock size={16} />, color: "bg-yellow-100 text-yellow-700", label: "Submitted" },
  verified: { icon: <CheckCircle size={16} />, color: "bg-green-100 text-green-700", label: "Verified" },
  rejected: { icon: <XCircle size={16} />, color: "bg-red-100 text-red-700", label: "Rejected" },
  rewarded: { icon: <CheckCircle size={16} />, color: "bg-purple-100 text-purple-700", label: "Rewarded" },
};

export default function TracePage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!identifier.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api<{ success: boolean; data: TraceResult }>(`/trace/${encodeURIComponent(identifier.trim())}`);
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Harvest not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trace a Harvest</h1>
        <p className="text-gray-500 mt-1">
          Enter a harvest code, ID, or transaction hash
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Harvest code or ID"
            placeholder="e.g. HARVEST-1, or transaction hash"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            loading={loading}
            className="w-full"
            size="lg"
          >
            <Scan size={20} className="inline mr-2" />
            Trace
          </Button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{result.harvest.cropType}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig[result.harvest.status]?.color || "bg-gray-100 text-gray-700"}`}>
                  {statusConfig[result.harvest.status]?.icon}
                  {statusConfig[result.harvest.status]?.label || result.harvest.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Quantity</p>
                  <p className="font-semibold">{result.harvest.quantity} {result.harvest.unit}</p>
                </div>
                <div>
                  <p className="text-gray-400">Quality</p>
                  <p className="font-semibold">Grade {result.harvest.qualityGrade}</p>
                </div>
                <div>
                  <p className="text-gray-400">Harvested</p>
                  <p className="font-semibold">{new Date(result.harvest.harvestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Submitted</p>
                  <p className="font-semibold">{new Date(result.harvest.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {result.harvest.farmerId && (
                <div className="border-t pt-3">
                  <p className="text-gray-400 text-sm">Farmer</p>
                  <p className="font-semibold">{result.harvest.farmerId.name}</p>
                </div>
              )}

              {result.harvest.farmId && (
                <div>
                  <p className="text-gray-400 text-sm">Farm</p>
                  <p className="font-semibold">{result.harvest.farmId.name}</p>
                  <p className="text-gray-500 text-sm">{result.harvest.farmId.location}</p>
                </div>
              )}
            </div>
          </Card>

          {result.onChain && (
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800">Verified on Blockchain</p>
                  <p className="text-sm text-green-700 mt-1">
                    This harvest has been recorded and verified on Avalanche.
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-green-600">
                    <p>Token ID: #{result.onChain.tokenId}</p>
                    <p>On-chain status: {result.onChain.verified ? "Verified" : "Pending"}</p>
                    <p>Reward minted: {result.onChain.rewardMinted ? "Yes" : "Pending"}</p>
                  </div>
                  {result.harvest.blockchainTxHash && (
                    <a
                      href={`https://testnet.snowtrace.io/tx/${result.harvest.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 hover:underline"
                    >
                      View transaction <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}

          {!result.onChain && result.harvest.status === "submitted" && (
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">Pending Verification</p>
                  <p className="text-sm text-yellow-600">
                    This harvest is waiting to be verified by a cooperative agent.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="bg-harvest-50 border-harvest-200">
        <div className="text-center py-2">
          <h3 className="font-bold text-harvest-800">How Traceability Works</h3>
          <p className="text-sm text-harvest-600 mt-2">
            Every verified harvest is recorded on the blockchain, providing a
            permanent, tamper-proof record from farm to table.
          </p>
        </div>
      </Card>
    </div>
  );
}
