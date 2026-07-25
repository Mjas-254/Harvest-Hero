"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Camera, Check, Plus, X } from "lucide-react";

function PhotoPreview({ file, index }: { file: File; index: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-harvest-300">
      {src && (
        <img src={src} alt={file.name} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-1 left-1">
        <Check size={12} className="text-white drop-shadow" />
      </div>
    </div>
  );
}

const CROPS = [
  { value: "Cassava", label: "Cassava" },
  { value: "Maize", label: "Maize (Corn)" },
  { value: "Rice", label: "Rice" },
  { value: "Cocoa", label: "Cocoa" },
  { value: "Yam", label: "Yam" },
  { value: "Plantain", label: "Plantain" },
  { value: "Soybean", label: "Soybean" },
  { value: "Groundnut", label: "Groundnut" },
  { value: "Millet", label: "Millet" },
  { value: "Sorghum", label: "Sorghum" },
  { value: "Other", label: "Other" },
];

const GRADES = [
  { value: "A", label: "A - Premium quality" },
  { value: "B", label: "B - Good quality" },
  { value: "C", label: "C - Standard quality" },
];

const UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "bags", label: "Bags" },
  { value: "bunches", label: "Bunches" },
  { value: "crates", label: "Crates" },
];

interface Farm {
  _id: string;
  name: string;
}

export default function SubmitPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [cropType, setCropType] = useState("Cassava");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [qualityGrade, setQualityGrade] = useState("B");
  const [harvestDate, setHarvestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [step, setStep] = useState(1);

  // Farm creation state
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [farmArea, setFarmArea] = useState("");
  const [farmCrops, setFarmCrops] = useState("");
  const [farmLoading, setFarmLoading] = useState(false);
  const [farmError, setFarmError] = useState("");

  const fetchFarms = () => {
    if (!token) return;
    api<{ data: Farm[] }>("/farm/farms", { token })
      .then((res) => {
        setFarms(res.data);
        if (res.data.length > 0) setFarmId(res.data[0]._id);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchFarms();
  }, [token]);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFarmError("");
    setFarmLoading(true);

    try {
      const res = await api<{ data: Farm }>("/farm/farms", {
        method: "POST",
        token: token!,
        body: {
          name: farmName,
          location: farmLocation,
          areaHectares: parseFloat(farmArea) || 1,
          crops: farmCrops.split(",").map((c) => c.trim()).filter(Boolean),
        },
      });

      setFarms((prev) => [...prev, res.data]);
      setFarmId(res.data._id);
      setShowFarmForm(false);
      setFarmName("");
      setFarmLocation("");
      setFarmArea("");
      setFarmCrops("");
    } catch (err: unknown) {
      setFarmError(err instanceof Error ? err.message : "Failed to create farm");
    } finally {
      setFarmLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files).slice(0, 5));
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await Promise.all(photos.map(fileToBase64));
      }

      const res = await api<{ data: { _id: string }; reward?: { points: number } }>("/farm/harvests", {
        method: "POST",
        token: token!,
        body: {
          farmId,
          cropType,
          quantity: parseFloat(quantity),
          unit,
          qualityGrade,
          harvestDate,
          notes,
          photoUrls,
        },
      });

      setEarnedPoints(res.reward?.points || 0);
      setSuccess(true);
      setTimeout(() => router.push("/history"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-harvest-600 mb-2">Verified!</h1>
        <p className="text-gray-500 text-lg">
          Your harvest has been verified and recorded.
        </p>
        {earnedPoints > 0 && (
          <div className="mt-4 bg-harvest-50 border-2 border-harvest-200 rounded-2xl p-5 inline-block">
            <p className="text-sm text-harvest-600 font-semibold mb-1">You earned</p>
            <p className="text-4xl font-bold text-harvest-700">+{earnedPoints} pts</p>
          </div>
        )}
        <div className="mt-6">
          <Button onClick={() => router.push("/history")}>
            View My Harvests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Record Harvest
        </h1>
        <p className="text-gray-500 mt-1">
          Tell us about what you harvested
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-harvest-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <Card>
              <div className="space-y-4">
                {farms.length > 0 && !showFarmForm ? (
                  <>
                    <Select
                      label="Which farm?"
                      value={farmId}
                      onChange={(e) => setFarmId(e.target.value)}
                      options={farms.map((f) => ({
                        value: f._id,
                        label: f.name,
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFarmForm(true)}
                      className="flex items-center gap-2 text-sm text-harvest-600 font-semibold hover:text-harvest-700"
                    >
                      <Plus size={16} />
                      Add a new farm
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        {farms.length === 0 ? "Create your first farm" : "Add a new farm"}
                      </p>
                      {farms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowFarmForm(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {farmError && (
                      <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
                        {farmError}
                      </div>
                    )}

                    <Input
                      label="Farm name"
                      placeholder="e.g. My Cassava Farm"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      required
                    />
                    <Input
                      label="Location"
                      placeholder="e.g. Ashanti Region, Kumasi"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Area (hectares)"
                        type="number"
                        placeholder="0"
                        value={farmArea}
                        onChange={(e) => setFarmArea(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                      <Input
                        label="Main crops"
                        placeholder="e.g. Cassava, Maize"
                        value={farmCrops}
                        onChange={(e) => setFarmCrops(e.target.value)}
                        hint="Comma separated"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleCreateFarm}
                      loading={farmLoading}
                      className="w-full"
                      size="md"
                    >
                      Create Farm
                    </Button>
                  </div>
                )}

                <Select
                  label="What did you harvest?"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  options={CROPS}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="How much?"
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0"
                    step="0.1"
                  />
                  <Select
                    label="Unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    options={UNITS}
                  />
                </div>
              </div>
            </Card>
            <Button
              type="button"
              onClick={() => setStep(2)}
              className="w-full"
              size="lg"
              disabled={!farmId || !quantity}
            >
              Next
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <div className="space-y-4">
                <Select
                  label="How good is the quality?"
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  options={GRADES}
                />

                <Input
                  label="When did you harvest?"
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Any notes? (optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-harvest-500 transition-colors outline-none resize-none"
                    rows={3}
                    placeholder="e.g. Good weather, healthy crops..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1"
                size="lg"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Card>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Add photos (optional but helps verification)
                  </label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-harvest-300 transition-colors">
                    <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">
                      Tap to add photos
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {photos.map((p, i) => (
                        <PhotoPreview key={i} file={p} index={i} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-harvest-50 rounded-xl p-4">
                  <h3 className="font-semibold text-harvest-800 mb-2">
                    Summary
                  </h3>
                  <div className="space-y-1 text-sm text-harvest-700">
                    <p>
                      <strong>Crop:</strong> {cropType}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {quantity} {unit}
                    </p>
                    <p>
                      <strong>Quality:</strong> Grade {qualityGrade}
                    </p>
                    <p>
                      <strong>Date:</strong> {harvestDate}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(2)}
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                type="submit"
                loading={loading}
                variant="success"
                className="flex-1"
                size="lg"
              >
                Submit
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
