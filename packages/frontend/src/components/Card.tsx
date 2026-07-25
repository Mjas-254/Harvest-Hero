"use client";

import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98] transition-all" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = "harvest",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    harvest: "bg-harvest-100 text-harvest-700",
    earth: "bg-earth-100 text-earth-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}
