"use client";

import { useState } from "react";
import {
  PropertyDetails,
  PROPERTY_TYPES,
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
    internalName: initialData.internalName || "",
    airbnbLink: initialData.airbnbLink || "",
    googleMapsLink: initialData.googleMapsLink || "",
    stateCity: initialData.stateCity || "",
    contactNumber: initialData.contactNumber || "",
    bedrooms: initialData.bedrooms || 1,
    bathrooms: initialData.bathrooms || 1,
    maxGuests: initialData.maxGuests || 2,
    basePrice: initialData.basePrice || 0,
    sellingPrice: initialData.sellingPrice || 0,
    propertyType: initialData.propertyType || "Homestay",
    description: initialData.description || "",
    highlights: initialData.highlights || "",
    amenities: initialData.amenities || "",
    checkInTime: initialData.checkInTime || "2:00 PM",
    checkoutTime: initialData.checkoutTime || "11:00 AM",
    parking: initialData.parking || "",
    kitchenDetails: initialData.kitchenDetails || "",
    houseRules: initialData.houseRules || "",
    viewLocation: initialData.viewLocation || "",
    specialFeatures: initialData.specialFeatures || "",
    bedConfiguration: initialData.bedConfiguration || "",
    wifi: initialData.wifi ?? true,
    hotWater: initialData.hotWater ?? true,
    essentials: initialData.essentials ?? true,
    petsAllowed: initialData.petsAllowed ?? false,
    aiDescription: initialData.aiDescription || "",
    googleRating: initialData.googleRating || "",
    googleReviews: initialData.googleReviews || "",
    googlePlaceId: initialData.googlePlaceId || "",
    dataSource: initialData.dataSource || "fursatphoto",
    lastEnriched: initialData.lastEnriched || new Date().toISOString().split("T")[0],
    host: initialData.host || "fursat",
  });

  const update = (field: keyof PropertyDetails, value: string | number | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate selling price as base price + 50%
      if (field === "basePrice" && typeof value === "number") {
        next.sellingPrice = Math.round(value * 1.5);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const sheetResult = submitResult?.sheetResult;
  const publishResult = submitResult?.publishResult;
  const hasResult = sheetResult || publishResult;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Essential fields — always visible */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Property Name</label>
            <input type="text" required value={form.propertyName} onChange={(e) => update("propertyName", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select required value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beds</label>
              <input type="number" min={0} value={form.bedrooms} onChange={(e) => update("bedrooms", parseInt(e.target.value) || 0)}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Baths</label>
              <input type="number" min={0} step={0.5} value={form.bathrooms} onChange={(e) => update("bathrooms", parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Guests</label>
              <input type="number" min={1} value={form.maxGuests} onChange={(e) => update("maxGuests", parseInt(e.target.value) || 1)}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost Price</label>
              <input type="number" min={0} value={form.basePrice} onChange={(e) => update("basePrice", parseInt(e.target.value) || 0)}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sell (+50%)</label>
              <input type="number" min={0} value={form.sellingPrice} onChange={(e) => update("sellingPrice", parseInt(e.target.value) || 0)}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Amenity toggles — compact row */}
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
        {expanded ? "Hide" : "Show"} advanced details (timings, parking, rules...)
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Check-in Time</label>
              <input type="text" value={form.checkInTime} onChange={(e) => update("checkInTime", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Checkout Time</label>
              <input type="text" value={form.checkoutTime} onChange={(e) => update("checkoutTime", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bed Configuration</label>
              <input type="text" value={form.bedConfiguration} onChange={(e) => update("bedConfiguration", e.target.value)} placeholder="1 King, 2 Queens"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Parking</label>
              <input type="text" value={form.parking} onChange={(e) => update("parking", e.target.value)} placeholder="Free parking on premises"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kitchen Details</label>
              <input type="text" value={form.kitchenDetails} onChange={(e) => update("kitchenDetails", e.target.value)} placeholder="Full kitchen"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">View / Location</label>
              <input type="text" value={form.viewLocation} onChange={(e) => update("viewLocation", e.target.value)} placeholder="Mountain view"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Highlights</label>
              <input type="text" value={form.highlights} onChange={(e) => update("highlights", e.target.value)} placeholder="Comma-separated"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Special Features</label>
              <input type="text" value={form.specialFeatures} onChange={(e) => update("specialFeatures", e.target.value)} placeholder="Private pool, Bonfire"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">House Rules</label>
            <textarea value={form.houseRules} onChange={(e) => update("houseRules", e.target.value)} rows={2} placeholder="No smoking, No loud music after 10 PM"
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
            disabled={isSubmitting || (!!sheetResult?.success && !!publishResult?.success)}
            className={`px-5 py-2.5 font-medium rounded-xl flex items-center gap-2 whitespace-nowrap text-sm ${
              sheetResult?.success && publishResult?.success
                ? "bg-green-500 text-white cursor-default"
                : isSubmitting
                ? "bg-white/50 text-purple-700 cursor-wait"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                Publishing...
              </>
            ) : sheetResult?.success && publishResult?.success ? (
              "Published & Synced"
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
