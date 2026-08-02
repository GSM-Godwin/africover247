"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { type AssetField } from "@/types/asset-field";

interface AssetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    rate: string | null;
    rateMin?: string | null;
    rateMax?: string | null;
    calculationBasis: string | null;
    assetFields: string | AssetField[] | null;
  };
}

function valueFieldKey(fields: AssetField[]): string | undefined {
  return fields.find(
    (f) =>
      f.key.toLowerCase().includes("value") ||
      f.key.toLowerCase().includes("amount") ||
      f.key.toLowerCase().includes("assured"),
  )?.key;
}

export function AssetDetailsModal({
  open,
  onClose,
  product,
}: AssetDetailsModalProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [calculatedPremium, setCalculatedPremium] = useState<number | null>(
    null,
  );

  const fields: AssetField[] = useMemo(
    () => {
      if (!product.assetFields) return [];
      if (Array.isArray(product.assetFields))
        return product.assetFields as AssetField[];
      if (typeof product.assetFields === "string") {
        try {
          return JSON.parse(product.assetFields) as AssetField[];
        } catch {
          return [];
        }
      }
      return [];
    },
    [product.assetFields],
  );

  const rate = product.rate ? parseFloat(product.rate) : null;
  const ratePercent = rate ? rate * 100 : null;
  const basisKey = valueFieldKey(fields);

  useEffect(() => {
    if (!rate || !basisKey) {
      setCalculatedPremium(null);
      return;
    }
    const rawValue = parseFloat(values[basisKey] || "0");
    if (rawValue > 0) {
      setCalculatedPremium(rawValue * rate);
    } else {
      setCalculatedPremium(null);
    }
  }, [values, rate, basisKey]);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleVehicleLookup(plateNumber: string) {
    if (!plateNumber || plateNumber.length < 5) return;
    setLookingUp(true);
    setLookupMessage("");
    try {
      const res = await api.post("/applications/verify-vehicle", {
        plateNumber,
      });
      const { verified, data, message } = res.data;

      if (verified && data) {
        const updates: Record<string, string> = {};
        if (data.make) updates.vehicleMake = data.make;
        if (data.model) updates.vehicleModel = data.model;
        if (data.year) updates.vehicleYear = data.year;
        if (data.colour) updates.vehicleColour = data.colour;
        if (data.engineNumber) updates.engineNumber = data.engineNumber;
        if (data.chassisNumber) updates.chassisNumber = data.chassisNumber;
        setValues((prev) => ({ ...prev, ...updates }));
        setLookupMessage("Vehicle details filled automatically.");
      } else {
        setLookupMessage(message || "Vehicle not found. Please fill in manually.");
      }
    } catch {
      setLookupMessage("Lookup failed. Please fill in manually.");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleConfirm() {
    const missing = fields
      .filter((f) => f.required && !values[f.key])
      .map((f) => f.label);

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/applications", {
        productId: product.id,
        assetDetails: values,
      });

      setLoading(false);
      onClose();
      router.push(`/apply/${product.id}/${res.data.id}/step-1`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not start application. Please try again.");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-midnight/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate/10">
          <div>
            <h2 className="font-display font-bold text-midnight text-xl">
              Asset Details
            </h2>
            <p className="font-body text-slate text-sm mt-0.5">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate hover:text-midnight transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                {field.label}
                {field.required && (
                  <span className="text-alert-coral ml-1">*</span>
                )}
              </label>

              {field.key === "plateNumber" ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        handleChange(field.key, e.target.value.toUpperCase())
                      }
                      placeholder={field.hint || "e.g. ABC123XY"}
                      className="flex-1 bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors uppercase"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleVehicleLookup(values[field.key] || "")
                      }
                      disabled={lookingUp || !values[field.key]}
                      className="text-xs font-body font-semibold text-daybreak hover:text-midnight disabled:opacity-40 transition-colors whitespace-nowrap pb-2"
                    >
                      {lookingUp ? "Looking up..." : "Auto-fill →"}
                    </button>
                  </div>
                  {lookupMessage && (
                    <p
                      className={`font-body text-xs mt-1 ${
                        lookupMessage.includes("automatically")
                          ? "text-cover-green"
                          : "text-alert-coral"
                      }`}
                    >
                      {lookupMessage}
                    </p>
                  )}
                </>
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.hint}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.hint}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors"
                />
              )}

              {field.hint &&
                field.type !== "textarea" &&
                field.key !== "plateNumber" && (
                <p className="font-body text-xs text-slate/60 mt-1">
                  {field.hint}
                </p>
              )}
            </div>
          ))}
        </div>

        {calculatedPremium !== null && ratePercent !== null && basisKey && (
          <div className="mx-6 mb-4 bg-daybreak/10 border border-daybreak/30 rounded-lg p-4">
            <p className="font-body text-sm text-slate mb-1">Calculated premium</p>
            <p className="font-mono text-midnight text-2xl font-medium">
              ₦{calculatedPremium.toLocaleString("en-NG")}/year
            </p>
            <p className="font-body text-xs text-slate mt-1 italic">
              ₦{parseFloat(values[basisKey] || "0").toLocaleString("en-NG")} ×{" "}
              {ratePercent}% = ₦{calculatedPremium.toLocaleString("en-NG")}/year
            </p>
          </div>
        )}

        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate/30 text-midnight font-body font-medium text-sm py-3 rounded-lg hover:border-midnight transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 transition-colors"
          >
            {loading ? "Starting..." : "Confirm & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
