"use client";

import { useState } from "react";
import { Search, Car } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

interface VehicleData {
  plateNumber: string;
  make: string | null;
  model: string | null;
  year: string | null;
  colour: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  ownerName: string | null;
  state: string | null;
}

export default function VehicleLookupPage() {
  const [plateNumber, setPlateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VehicleData | null>(null);
  const [error, setError] = useState("");

  async function handleLookup() {
    if (!plateNumber.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/applications/verify-vehicle", {
        plateNumber: plateNumber.trim().toUpperCase(),
      });
      if (res.data.verified && res.data.data) {
        setResult(res.data.data);
      } else {
        setError(res.data.message || "Vehicle not found.");
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(message || "Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <AdminPageHeader
        title="Vehicle Lookup"
        subtitle="Look up vehicle details by plate number via Dojah"
      />

      <div className="bg-white border border-slate/10 rounded-xl p-6 mb-6">
        <label className="block font-body text-sm font-semibold text-midnight mb-2">
          Plate Number
        </label>
        <div className="flex gap-3">
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="e.g. ABC123XY"
            className="flex-1 border border-slate/20 rounded-lg px-4 py-2.5 font-mono text-base text-midnight focus:outline-none focus:border-daybreak uppercase"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !plateNumber.trim()}
            className="flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#C4700E] disabled:opacity-50 transition-colors"
          >
            <Search size={16} />
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl p-4 mb-6">
          <p className="font-body text-sm text-alert-coral">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white border border-slate/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate/10 bg-cover-green/5">
            <Car size={18} className="text-cover-green" />
            <div>
              <p className="font-body font-semibold text-midnight text-base">
                Vehicle Found
              </p>
              <p className="font-mono text-sm text-slate">{result.plateNumber}</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {[
              { label: "Make", value: result.make },
              { label: "Model", value: result.model },
              { label: "Year", value: result.year },
              { label: "Colour", value: result.colour },
              { label: "Engine Number", value: result.engineNumber },
              { label: "Chassis Number", value: result.chassisNumber },
              { label: "Owner Name", value: result.ownerName },
              { label: "State", value: result.state },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className="font-body text-sm font-semibold text-midnight">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
