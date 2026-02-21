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
    dataSource: initialData.dataSource || "fursatphoto",
    lastEnriched: initialData.lastEnriched || new Date().toISOString().split("T")[0],
    host: initialData.host || "fursat",
  });

  const update = (field: keyof PropertyDetails, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const sheetResult = submitResult?.sheetResult;
  const publishResult = submitResult?.publishResult;
  const hasResult = sheetResult || publishResult;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Property Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property Name *
            </label>
            <input
              type="text"
              required
              value={form.propertyName}
              onChange={(e) => update("propertyName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Airbnb Name
            </label>
            <input
              type="text"
              value={form.airbnbName}
              onChange={(e) => update("airbnbName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property Type *
            </label>
            <select
              required
              value={form.propertyType}
              onChange={(e) => update("propertyType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State / City
            </label>
            <input
              type="text"
              value={form.stateCity}
              onChange={(e) => update("stateCity", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Capacity & Pricing */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Capacity & Pricing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bedrooms *
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bathrooms *
            </label>
            <input
              type="number"
              required
              min={0}
              step={0.5}
              value={form.bathrooms}
              onChange={(e) => update("bathrooms", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Guests *
            </label>
            <input
              type="number"
              required
              min={1}
              value={form.maxGuests}
              onChange={(e) => update("maxGuests", parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Price
            </label>
            <input
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => update("basePrice", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Selling Price
            </label>
            <input
              type="number"
              min={0}
              value={form.sellingPrice}
              onChange={(e) => update("sellingPrice", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Timings & Amenities */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Timings & Amenities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-in Time
            </label>
            <input
              type="text"
              value={form.checkInTime}
              onChange={(e) => update("checkInTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Checkout Time
            </label>
            <input
              type="text"
              value={form.checkoutTime}
              onChange={(e) => update("checkoutTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {AMENITY_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => update(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parking
            </label>
            <input
              type="text"
              value={form.parking}
              onChange={(e) => update("parking", e.target.value)}
              placeholder="e.g., Free parking on premises"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kitchen Details
            </label>
            <input
              type="text"
              value={form.kitchenDetails}
              onChange={(e) => update("kitchenDetails", e.target.value)}
              placeholder="e.g., Full kitchen with essentials"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Additional Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bed Configuration
            </label>
            <input
              type="text"
              value={form.bedConfiguration}
              onChange={(e) => update("bedConfiguration", e.target.value)}
              placeholder="e.g., 1 King, 2 Queens"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              View / Location
            </label>
            <input
              type="text"
              value={form.viewLocation}
              onChange={(e) => update("viewLocation", e.target.value)}
              placeholder="e.g., Mountain view, Beachfront"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Highlights
            </label>
            <input
              type="text"
              value={form.highlights}
              onChange={(e) => update("highlights", e.target.value)}
              placeholder="Comma-separated highlights"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Special Features
            </label>
            <input
              type="text"
              value={form.specialFeatures}
              onChange={(e) => update("specialFeatures", e.target.value)}
              placeholder="e.g., Private pool, Bonfire area"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            House Rules
          </label>
          <textarea
            value={form.houseRules}
            onChange={(e) => update("houseRules", e.target.value)}
            rows={2}
            placeholder="e.g., No smoking, No loud music after 10 PM"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <h3 className="text-xl font-bold mb-1">
              Publish to Fursat.fun & Sync Sheet
            </h3>
            <p className="text-purple-100 text-sm">
              Creates a draft listing on Fursat.fun and adds the property to the Listings sheet
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || (!!sheetResult?.success && !!publishResult?.success)}
            className={`px-6 py-3 font-medium rounded-xl button-press flex items-center gap-2 whitespace-nowrap ${
              sheetResult?.success && publishResult?.success
                ? "bg-green-500 text-white cursor-default"
                : isSubmitting
                ? "bg-white/50 text-purple-700 cursor-wait"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <span>Publishing...</span>
              </>
            ) : sheetResult?.success && publishResult?.success ? (
              <span>Published & Synced</span>
            ) : (
              <span>Publish & Sync</span>
            )}
          </button>
        </div>

        {/* Results */}
        {hasResult && (
          <div className="mt-4 space-y-2">
            {sheetResult && (
              <div
                className={`p-3 rounded-xl ${
                  sheetResult.success
                    ? "bg-green-500/20 text-white"
                    : "bg-red-500/20 text-white"
                }`}
              >
                {sheetResult.success ? (
                  <p className="text-sm">
                    Sheet: {sheetResult.action === "created" && "New row added"}
                    {sheetResult.action === "updated" && "Existing row updated"}
                    {sheetResult.action === "already_exists" && "Property already exists in sheet"}
                    {sheetResult.rowNumber && ` (row ${sheetResult.rowNumber})`}
                  </p>
                ) : (
                  <p className="text-sm">Sheet error: {sheetResult.error}</p>
                )}
              </div>
            )}
            {publishResult && (
              <div
                className={`p-3 rounded-xl ${
                  publishResult.success
                    ? "bg-green-500/20 text-white"
                    : "bg-red-500/20 text-white"
                }`}
              >
                {publishResult.success ? (
                  <div>
                    <p className="text-sm">Fursat.fun: Listing created successfully!</p>
                    {publishResult.editUrl && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_FURSAT_URL || "http://localhost:3001"}${publishResult.editUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-4 py-1.5 bg-white text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50"
                      >
                        Edit Listing
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">Fursat.fun error: {publishResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
