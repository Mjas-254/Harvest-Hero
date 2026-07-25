"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Trophy, Award, Star, ShoppingBag, Check, ArrowRight, X } from "lucide-react";

interface Reward {
  _id: string;
  rewardType: string;
  points: number;
  status: string;
  createdAt: string;
  harvestId: { cropType: string; quantity: number; unit: string } | null;
}

interface Redemption {
  _id: string;
  method: string;
  pointsSpent: number;
  description: string;
  status: string;
  reference: string;
  createdAt: string;
}

interface RedemptionOption {
  id: string;
  cost: number;
  description: string;
}

interface RewardStats {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  totalNfts: number;
  recentRewards: Reward[];
}

const REDEMPTION_ICONS: Record<string, string> = {
  mobile_money: "📱",
  seeds: "🌱",
  fertilizer: "🧪",
  tools: "🔧",
  vouchers: "🎟️",
};

export default function RewardsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [options, setOptions] = useState<RedemptionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [confirmOption, setConfirmOption] = useState<RedemptionOption | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{ option: RedemptionOption; ref: string } | null>(null);

  const fetchAll = () => {
    if (!token) return;
    Promise.all([
      api<{ data: RewardStats }>("/rewards/stats", { token }),
      api<{ data: Reward[] }>("/rewards", { token }),
      api<{ data: Redemption[] }>("/rewards/redemptions", { token }),
      api<{ data: RedemptionOption[] }>("/rewards/options", { token }),
    ])
      .then(([statsRes, rewardsRes, redemptionsRes, optionsRes]) => {
        setStats(statsRes.data);
        setRewards(rewardsRes.data);
        setRedemptions(redemptionsRes.data);
        setOptions(optionsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const handleRedeem = async (option: RedemptionOption) => {
    if (!token) return;
    setRedeeming(option.id);
    try {
      const res = await api<{ data: Redemption; remaining: number }>("/rewards/redeem", {
        method: "POST",
        token,
        body: { optionId: option.id },
      });
      setRedeemSuccess({ option, ref: res.data.reference });
      setStats((prev) =>
        prev ? { ...prev, totalPoints: res.remaining, totalRedeemed: prev.totalRedeemed + option.cost } : prev
      );
      setRedemptions((prev) => [res.data, ...prev]);
      setConfirmOption(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      alert(msg);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">🏆</div>
        <p className="text-gray-500">Loading your rewards...</p>
      </div>
    );
  }

  const badges = [
    { name: "First Harvest", desc: "Submit your first harvest", earned: (stats?.totalNfts ?? 0) >= 1, icon: "🌱" },
    { name: "Verified Farmer", desc: "Get a harvest verified", earned: (stats?.totalNfts ?? 0) >= 1, icon: "✅" },
    { name: "Quality King", desc: "Submit 5 Grade A harvests", earned: false, icon: "👑" },
    { name: "Streak Master", desc: "7 days in a row", earned: false, icon: "🔥" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rewards</h1>
        <p className="text-gray-500 mt-1">
          Points and badges you&apos;ve earned
        </p>
      </div>

      {/* Points Card */}
      <Card className="bg-gradient-to-r from-harvest-500 to-harvest-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Trophy size={32} />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats?.totalPoints || 0}</p>
              <p className="text-harvest-100">Available Points</p>
            </div>
          </div>
          {(stats?.totalRedeemed || 0) > 0 && (
            <div className="text-right text-sm text-harvest-200">
              <p>Redeemed: {stats?.totalRedeemed}</p>
              <p>Earned: {stats?.totalEarned}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Redemption Options */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <ShoppingBag size={20} />
          Redeem Points
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const canAfford = (stats?.totalPoints || 0) >= opt.cost;
            const methodKey = opt.id.startsWith("mobile_money") ? "mobile_money" : opt.id;
            const icon = REDEMPTION_ICONS[methodKey] || "🎁";
            return (
              <Card
                key={opt.id}
                className={`relative ${canAfford ? "active:bg-gray-50 cursor-pointer" : "opacity-50"}`}
                onClick={() => canAfford && setConfirmOption(opt)}
              >
                <div className="text-center py-1">
                  <span className="text-2xl block mb-1">{icon}</span>
                  <p className="font-semibold text-sm text-gray-900">{opt.description}</p>
                  <p className="text-harvest-600 font-bold mt-1">{opt.cost} pts</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Badges</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((b) => (
            <Card
              key={b.name}
              className={`text-center ${b.earned ? "" : "opacity-40 grayscale"}`}
            >
              <span className="text-3xl block mb-2">{b.icon}</span>
              <p className="font-semibold text-sm">{b.name}</p>
              <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
              {b.earned && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-harvest-100 text-harvest-700 rounded-full text-xs font-semibold">
                  Earned
                </span>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Redemption History */}
      {redemptions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Redemption History</h2>
          <div className="space-y-2">
            {redemptions.map((r) => (
              <Card key={r._id} className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <ShoppingBag size={18} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{r.description}</p>
                  <p className="text-xs text-gray-400">
                    {r.reference} | {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-bold text-red-500">-{r.pointsSpent}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Earn History */}
      {rewards.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Earn History</h2>
          <div className="space-y-2">
            {rewards.slice(0, 10).map((r) => (
              <Card key={r._id} className="flex items-center gap-3">
                <div className="p-2 bg-earth-100 rounded-xl">
                  <Star size={18} className="text-earth-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {r.rewardType === "harvest_nft"
                      ? "Harvest reward"
                      : r.rewardType === "quality_bonus"
                      ? "Quality bonus"
                      : "Streak bonus"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.harvestId?.cropType || "Harvest"} |{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-bold text-harvest-600">+{r.points}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmOption && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Confirm Redemption</h3>
              <button onClick={() => setConfirmOption(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-harvest-50 rounded-xl p-4 text-center">
              <span className="text-3xl block mb-2">
                {REDEMPTION_ICONS[confirmOption.id.startsWith("mobile_money") ? "mobile_money" : confirmOption.id] || "🎁"}
              </span>
              <p className="font-bold text-lg text-gray-900">{confirmOption.description}</p>
              <p className="text-harvest-600 font-bold text-xl mt-1">{confirmOption.cost} points</p>
            </div>
            <p className="text-sm text-gray-500 text-center">
              You have <span className="font-bold text-harvest-600">{stats?.totalPoints || 0}</span> points available
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmOption(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={redeeming === confirmOption.id}
                onClick={() => handleRedeem(confirmOption)}
              >
                Redeem
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {redeemSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-bold text-gray-900">Redeemed!</h3>
            <p className="text-gray-500">
              You redeemed <span className="font-semibold">{redeemSuccess.option.description}</span> for{" "}
              <span className="font-bold text-harvest-600">{redeemSuccess.option.cost} points</span>
            </p>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Reference</p>
              <p className="font-mono font-bold text-sm">{redeemSuccess.ref}</p>
            </div>
            <Button className="w-full" onClick={() => setRedeemSuccess(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
