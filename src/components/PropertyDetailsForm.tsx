"use client";

import { useState } from "react";
import {
  PropertyDetails,
  PRICING_TYPES,
  AMENITY_OPTIONS,
  SyncSheetResponse,
} from "@/types/property";

interface PropertyDetailsFormProps {
  initialData: Partial<PropertyDetails>;
  onSubmit: (details: PropertyDetails) => void;
  isSubmitting: boolean;
  submitResult: {
    sheetResult?: SyncSheetResponse | null;
    publishResult?: {
      success: boolean;
      listingId?: string;
      editUrl?: string;
      error?: string;
    } | null;
  } | null;
}

export default function PropertyDetailsForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitResult,
}: PropertyDetailsFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<PropertyDetails>({
    propertyName: initialData.propertyName || "",
    airbnbName: initialData.airbnbName || "",
    airbnbLink: initialData.airbnbLink || "",
    googleMapsLink: initialData.googleMapsLink || "",
    stateCity: initialData.stateCity || "",
    contactNumber: initialData.contactNumber || "",
    totalRooms: initialData.totalRooms ?? 0,
    bathrooms: initialData.bathrooms ?? 0,
    beds: initialData.beds ?? 0,
    guests: initialData.guests ?? 0,
    pricingType: initialData.pricingType || "Room Wise",
    costPrice: initialData.costPrice ?? 0,
    sellingPrice: initialData.sellingPrice ?? 0,
    extraGuestPriceAfter: initialData.extraGuestPriceAfter ?? 0,
    extraGuestPrice: initialData.extraGuestPrice ?? 0,
    petFee: initialData.petFee ?? 0,
    essentials: initialData.essentials ?? true,
    wifi: initialData.wifi ?? true,
    hotWater: initialData.hotWater ?? true,
    petsAllowed: initialData.petsAllowed ?? false,
    otherAmenities: initialData.otherAmenities || "",
    aiDescription: initialData.aiDescription || "",
    googleRating: initialData.googleRating || "",
    googleReviews: initialData.googleReviews || "",
    googlePlaceId: initialData.googlePlaceId || "",
    lastEnriched: initialData.lastEnriched || new Date().toISOString().split("T")[0],
    cancellationPolicy: initialData.cancellationPolicy || "",
    upiId: initialData.upiId || "",
  });

  const update = (field: keyof PropertyDetails, value: string | number | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate selling price as cost + 50%
      if (field === "costPrice" && typeof value === "number") {
        next.sellingPrice = Math.round(value * 1.5);
      }
      return next;
    });
  };

  // For number inputs: show empty string when value is 0 (unfilled), write "" to sheet
  const numDisplay = (val: number) => (val === 0 ? "" : String(val));
  const numParse = (str: string) => parseInt(str) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const sheetResult = submitResult?.sheetResult;
  const publishResult = submitResult?.publishResult;
  const hasResult = sheetResult || publishResult;
  const allSuccess = !!sheetResult?.success && !!publishResult?.success;

  const pricingLabel = form.pricingType === "Per Person" ? "/person" : form.pricingType === "Room Wise" ? "/room" : "/property";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Essential fields */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Property Name</label>
            <input type="text" required value={form.propertyName} onChange={(e) => update("propertyName", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pricing Type</label>
            <select required value={form.pricingType} onChange={(e) => update("pricingType", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {PRICING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rooms</label>
              <input type="number" min={0} value={numDisplay(form.totalRooms)} placeholder="-"
                onChange={(e) => update("totalRooms", numParse(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beds</label>
              <input type="number" min={0} value={numDisplay(form.beds)} placeholder="-"
                onChange={(e) => update("beds", numParse(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Guests</label>
              <input type="number" min={0} value={numDisplay(form.guests)} placeholder="-"
                onChange={(e) => update("guests", numParse(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost {pricingLabel}</label>
              <input type="number" min={0} value={numDisplay(form.costPrice)} placeholder="-"
                onChange={(e) => update("costPrice", numParse(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sell (+50%)</label>
              <input type="number" min={0} value={numDisplay(form.sellingPrice)} placeholder="-"
                onChange={(e) => update("sellingPrice", numParse(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Amenity toggles */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {AMENITY_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={form[key] as boolean} onChange={(e) => update(key, e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Expandable advanced section */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-1"
      >
        <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6" />
        </svg>
        {expanded ? "Hide" : "Show"} advanced details (extra guest pricing, contact, UPI...)
      </button>

      {expanded && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Airbnb Name</label>
              <input type="text" value={form.airbnbName} onChange={(e) => update("airbnbName", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">State / City</label>
              <input type="text" value={form.stateCity} onChange={(e) => update("stateCity", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bathrooms</label>
              <input type="number" min={0} value={numDisplay(form.bathrooms)} placeholder="-"
                onChange={(e) => update("bathrooms", numParse(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Extra Guest Price After</label>
              <input type="number" min={0} value={numDisplay(form.extraGuestPriceAfter)} placeholder="-"
                onChange={(e) => update("extraGuestPriceAfter", numParse(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Extra Guest Price</label>
              <input type="number" min={0} value={numDisplay(form.extraGuestPrice)} placeholder="-"
                onChange={(e) => update("extraGuestPrice", numParse(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pet Fee</label>
              <input type="number" min={0} value={numDisplay(form.petFee)} placeholder="-"
                onChange={(e) => update("petFee", numParse(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contact Number</label>
              <input type="text" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">UPI ID</label>
              <input type="text" value={form.upiId} onChange={(e) => update("upiId", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cancellation Policy</label>
              <input type="text" value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Other Amenities</label>
            <input type="text" value={form.otherAmenities} onChange={(e) => update("otherAmenities", e.target.value)} placeholder="Comma-separated"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-white">
            <h3 className="text-lg font-bold">Publish & Sync Sheet</h3>
            <p className="text-purple-100 text-xs">Draft listing on Fursat.fun + add to Listings sheet</p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2.5 font-medium rounded-xl flex items-center gap-2 whitespace-nowrap text-sm ${
              isSubmitting
                ? "bg-white/50 text-purple-700 cursor-wait"
                : allSuccess
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                Publishing...
              </>
            ) : allSuccess ? (
              "Re-publish & Sync"
            ) : hasResult ? (
              "Retry"
            ) : (
              "Publish & Sync"
            )}
          </button>
        </div>

        {hasResult && (
          <div className="mt-3 space-y-2">
            {sheetResult && (
              <div className={`p-2.5 rounded-lg text-sm ${sheetResult.success ? "bg-green-500/20 text-white" : "bg-red-500/20 text-white"}`}>
                {sheetResult.success
                  ? `Sheet: ${sheetResult.action === "created" ? "New row added" : sheetResult.action === "updated" ? "Row updated" : "Already exists"}${sheetResult.rowNumber ? ` (row ${sheetResult.rowNumber})` : ""}`
                  : `Sheet error: ${sheetResult.error}`}
              </div>
            )}
            {publishResult && (
              <div className={`p-2.5 rounded-lg text-sm ${publishResult.success ? "bg-green-500/20 text-white" : "bg-red-500/20 text-white"}`}>
                {publishResult.success ? (
                  <span>
                    Fursat.fun: Listing created
                    {publishResult.editUrl && (
                      <a href={`${process.env.NEXT_PUBLIC_FURSAT_URL || "http://localhost:3001"}${publishResult.editUrl}`}
                        target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                        Edit
                      </a>
                    )}
                  </span>
                ) : `Fursat.fun error: ${publishResult.error}`}
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
