"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("farmer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      await register({ name, phone, pin, role });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-harvest-500 to-harvest-700 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-white">Join Harvest Hero</h1>
          <p className="text-harvest-100 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <Input
            label="Your name"
            placeholder="e.g. Amina Osei"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Phone number"
            type="tel"
            placeholder="e.g. 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Create a PIN"
            type="password"
            placeholder="4-6 digits (remember it!)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            minLength={4}
            maxLength={6}
            hint="You will use this to sign in"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === "farmer"
                    ? "border-harvest-500 bg-harvest-50 text-harvest-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                <span className="text-2xl block mb-1">👨‍🌾</span>
                <span className="font-semibold">Farmer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("verifier")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === "verifier"
                    ? "border-harvest-500 bg-harvest-50 text-harvest-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                <span className="text-2xl block mb-1">✅</span>
                <span className="font-semibold">Verifier</span>
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-harvest-600 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
