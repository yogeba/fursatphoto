"use client";

import { useState, useEffect } from "react";
import URLInput from "@/components/URLInput";
import PhotoGallery from "@/components/PhotoGallery";
import {
  AppState,
  ExtractPlaceResponse,
  SearchPlaceResponse,
  PlaceDetails,
} from "@/types/maps";
import { PropertyDetails, SyncSheetResponse } from "@/types/property";
import PropertyDetailsForm from "@/components/PropertyDetailsForm";
import JSZip from "jszip";

const STORAGE_KEY = "fursatphoto_generate_description";
const AUTH_KEY = "fursatphoto_auth";
const PASSWORD = "fursat2024";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [appState, setAppState] = useState<AppState>({
    isLoading: false,
    loadingMessage: null,
    error: null,
    placeName: null,
    placeId: null,
    photos: [],
    selectedPhotos: new Set<string>(),
    reviews: [],
    rating: null,
    totalReviews: null,
    generatedDescription: null,
    isGeneratingDescription: false,
    coordinates: null,
    location: null,
  });
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [editableDescription, setEditableDescription] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; listingId?: string; editUrl?: string; error?: string } | null>(null);
  const [sheetSyncResult, setSheetSyncResult] = useState<SyncSheetResponse | null>(null);
  const [enableDescription, setEnableDescription] = useState(true);

  // Auth check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved === "true") setAuthenticated(true);
    }
  }, []);

  // Load description preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setEnableDescription(saved === "true");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem(AUTH_KEY, "true");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const toggleDescription = () => {
    const newValue = !enableDescription;
    setEnableDescription(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  // Sync editable description when AI generates it
  useEffect(() => {
    if (appState.generatedDescription) {
      setEditableDescription(appState.generatedDescription);
    }
  }, [appState.generatedDescription]);

  const handleURLSubmit = async (url: string) => {
    setOriginalUrl(url);
    setAppState({
      isLoading: true,
      loadingMessage: "Parsing Google Maps URL...",
      error: null,
      placeName: null,
      placeId: null,
      photos: [],
      selectedPhotos: new Set<string>(),
      reviews: [],
      rating: null,
      totalReviews: null,
      generatedDescription: null,
      isGeneratingDescription: false,
      coordinates: null,
      location: null,
    });
    setPublishResult(null);
    setSheetSyncResult(null);
    setEditableDescription("");

    try {
      // Step 1: Extract place data
      setAppState((prev) => ({ ...prev, loadingMessage: "Extracting coordinates from URL..." }));
      const extractResponse = await fetch("/api/extract-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || "Could not parse the Google Maps URL. Make sure you're using the full URL from the browser address bar, not a shortened link.");
      }

      const extractData: ExtractPlaceResponse = await extractResponse.json();

      // Step 2: Search for place
      setAppState((prev) => ({ ...prev, loadingMessage: `Searching for "${extractData.placeName}" on Google Maps...` }));
      const searchResponse = await fetch("/api/search-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: extractData.coordinates.lat,
          lng: extractData.coordinates.lng,
          keyword: extractData.placeName,
        }),
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.error || `Could not find "${extractData.placeName}" on Google Maps. The place may not have a Google listing or the coordinates may be incorrect.`);
      }

      const searchData: SearchPlaceResponse = await searchResponse.json();

      // Step 3: Get place details
      setAppState((prev) => ({ ...prev, loadingMessage: `Loading photos and reviews for ${searchData.placeName}...` }));
      const detailsResponse = await fetch("/api/place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: searchData.placeId }),
      });

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        throw new Error(errorData.error || `Google Maps returned an error when loading details for "${searchData.placeName}". This might be a temporary issue — try again in a moment.`);
      }

      const detailsData: PlaceDetails = await detailsResponse.json();

      // Select all photos by default
      const allPhotoRefs = new Set((detailsData.photos || []).map((p) => p.photo_reference));

      setAppState({
        isLoading: false,
        loadingMessage: null,
        error: null,
        placeName: detailsData.name,
        placeId: searchData.placeId,
        photos: detailsData.photos || [],
        selectedPhotos: allPhotoRefs,
        reviews: enableDescription ? (detailsData.reviews || []) : [],
        rating: enableDescription ? (detailsData.rating || null) : null,
        totalReviews: enableDescription ? (detailsData.user_ratings_total || null) : null,
        generatedDescription: null,
        isGeneratingDescription: enableDescription && (detailsData.reviews?.length ?? 0) > 0,
        coordinates: extractData.coordinates,
        location: extractData.placeName,
      });

      // Step 4: Generate description (async)
      if (enableDescription && detailsData.reviews && detailsData.reviews.length > 0) {
        try {
          const descResponse = await fetch("/api/generate-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reviews: detailsData.reviews,
              rating: detailsData.rating,
              totalReviews: detailsData.user_ratings_total,
              placeName: detailsData.name,
            }),
          });

          if (descResponse.ok) {
            const descData = await descResponse.json();
            setAppState((prev) => ({ ...prev, generatedDescription: descData.description, isGeneratingDescription: false }));
          } else {
            setAppState((prev) => ({ ...prev, isGeneratingDescription: false, error: "AI description generation failed — you can write one manually below." }));
          }
        } catch {
          setAppState((prev) => ({ ...prev, isGeneratingDescription: false }));
        }
      }
    } catch (error) {
      setAppState((prev) => ({
        ...prev,
        isLoading: false,
        loadingMessage: null,
        error: error instanceof Error ? error.message : "An unexpected error occurred. Please check your internet connection and try again.",
      }));
    }
  };

  const handleRegenerate = async () => {
    if (appState.reviews.length === 0) return;
    setAppState((prev) => ({ ...prev, isGeneratingDescription: true }));
    try {
      const descResponse = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: appState.reviews,
          rating: appState.rating,
          totalReviews: appState.totalReviews,
          placeName: appState.placeName,
        }),
      });
      if (descResponse.ok) {
        const descData = await descResponse.json();
        setAppState((prev) => ({ ...prev, generatedDescription: descData.description, isGeneratingDescription: false }));
      } else {
        setAppState((prev) => ({ ...prev, isGeneratingDescription: false }));
      }
    } catch {
      setAppState((prev) => ({ ...prev, isGeneratingDescription: false }));
    }
  };

  const handleTogglePhoto = (ref: string) => {
    setAppState((prev) => {
      const next = new Set(prev.selectedPhotos);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return { ...prev, selectedPhotos: next };
    });
  };

  const handleSelectAllPhotos = () => {
    setAppState((prev) => ({
      ...prev,
      selectedPhotos: new Set(prev.photos.map((p) => p.photo_reference)),
    }));
  };

  const handleDeselectAllPhotos = () => {
    setAppState((prev) => ({ ...prev, selectedPhotos: new Set() }));
  };

  const handleDownloadPhoto = async (photoReference: string, filename: string) => {
    try {
      const response = await fetch("/api/download-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoReference, filename }),
      });
      if (!response.ok) throw new Error("Failed to download photo");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading photo:", error);
    }
  };

  const handleDownloadSelected = async () => {
    const selected = appState.photos.filter((p) => appState.selectedPhotos.has(p.photo_reference));
    if (selected.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const name = appState.placeName?.replace(/\s+/g, "_") || "place";
      await Promise.all(
        selected.map(async (photo, i) => {
          const response = await fetch("/api/download-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoReference: photo.photo_reference, filename: `${name}_${i + 1}.jpg` }),
          });
          if (response.ok) {
            const blob = await response.blob();
            zip.file(`${name}_${i + 1}.jpg`, blob);
          }
        })
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading photos:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePublishAndSync = async (details: PropertyDetails) => {
    setIsPublishing(true);
    setPublishResult(null);
    setSheetSyncResult(null);

    // Only send selected photos
    const selectedPhotoObjects = appState.photos.filter((p) => appState.selectedPhotos.has(p.photo_reference));

    const [sheetSettled, fursatSettled] = await Promise.allSettled([
      fetch("/api/sync-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyDetails: details, mode: "create" }),
      }).then((r) => r.json()),
      fetch("/api/publish-to-fursat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName: details.propertyName,
          rating: appState.rating,
          totalReviews: appState.totalReviews,
          photos: selectedPhotoObjects,
          reviews: appState.reviews,
          coordinates: appState.coordinates,
          location: details.stateCity || appState.location || details.propertyName,
          googleMapsUrl: originalUrl,
          generatedDescription: details.aiDescription,
        }),
      }).then((r) => r.json()),
    ]);

    if (sheetSettled.status === "fulfilled") {
      setSheetSyncResult(sheetSettled.value);
    } else {
      setSheetSyncResult({ success: false, action: "created", error: sheetSettled.reason?.message || "Sheet sync failed" });
    }

    if (fursatSettled.status === "fulfilled") {
      const data = fursatSettled.value;
      if (data.error) {
        setPublishResult({ success: false, error: data.error });
      } else {
        setPublishResult({ success: true, listingId: data.listingId, editUrl: data.editUrl });
      }
    } else {
      setPublishResult({ success: false, error: fursatSettled.reason?.message || "Publish failed" });
    }

    setIsPublishing(false);
  };

  const resetApp = () => {
    setOriginalUrl(null);
    setEditableDescription("");
    setAppState({
      isLoading: false,
      loadingMessage: null,
      error: null,
      placeName: null,
      placeId: null,
      photos: [],
      selectedPhotos: new Set<string>(),
      reviews: [],
      rating: null,
      totalReviews: null,
      generatedDescription: null,
      isGeneratingDescription: false,
      coordinates: null,
      location: null,
    });
    setPublishResult(null);
    setSheetSyncResult(null);
  };

  const hasResults = appState.photos.length > 0;

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Fursat Photo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Enter password to continue</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 border rounded-xl mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${passwordError ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
          />
          {passwordError && <p className="text-red-500 text-sm mb-3">Incorrect password</p>}
          <button type="submit" className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header — compact */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fursat Photo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Extract photos, generate descriptions, publish to Fursat.fun
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* URL Input — always visible */}
          <URLInput
            onSubmit={handleURLSubmit}
            isLoading={appState.isLoading}
            enableDescription={enableDescription}
            onToggleDescription={toggleDescription}
          />

          {/* Loading indicator */}
          {appState.isLoading && (
            <div className="flex items-center gap-3 justify-center py-6 text-gray-600 dark:text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm">{appState.loadingMessage || "Loading..."}</span>
            </div>
          )}

          {/* Error — inline, not a separate page */}
          {appState.error && !appState.isLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{appState.error}</p>
              {!hasResults && (
                <button onClick={resetApp} className="mt-2 text-sm text-red-600 dark:text-red-400 underline">
                  Clear and try again
                </button>
              )}
            </div>
          )}

          {/* Results section — appears below URL input */}
          {hasResults && (
            <div className="space-y-6">
              {/* Place header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{appState.placeName}</h2>
                    {appState.rating && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {appState.rating.toFixed(1)} stars
                        {appState.totalReviews && ` from ${appState.totalReviews} reviews`}
                      </p>
                    )}
                  </div>
                  <button onClick={resetApp} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    New search
                  </button>
                </div>
              </div>

              {/* Photo gallery with selection */}
              <PhotoGallery
                photos={appState.photos}
                placeName={appState.placeName || ""}
                selectedPhotos={appState.selectedPhotos}
                onTogglePhoto={handleTogglePhoto}
                onSelectAll={handleSelectAllPhotos}
                onDeselectAll={handleDeselectAllPhotos}
                onDownloadPhoto={handleDownloadPhoto}
                onDownloadSelected={handleDownloadSelected}
                isDownloading={isDownloading}
              />

              {/* AI Description — editable */}
              {(appState.isGeneratingDescription || editableDescription || appState.reviews.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Description</h3>
                    <div className="flex gap-2">
                      {appState.reviews.length > 0 && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          disabled={appState.isGeneratingDescription}
                          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
                        >
                          {appState.isGeneratingDescription ? "Generating..." : "Regenerate"}
                        </button>
                      )}
                      {editableDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editableDescription);
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>

                  {appState.isGeneratingDescription && !editableDescription ? (
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm py-4">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      Generating description from {appState.reviews.length} reviews...
                    </div>
                  ) : (
                    <textarea
                      value={editableDescription}
                      onChange={(e) => setEditableDescription(e.target.value)}
                      rows={12}
                      placeholder="AI description will appear here, or write your own..."
                      className="w-full px-4 py-3 text-sm leading-relaxed border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 resize-y"
                    />
                  )}
                </div>
              )}

              {/* Property details + publish */}
              {(editableDescription || !enableDescription) && (
                <PropertyDetailsForm
                  initialData={{
                    propertyName: appState.placeName || "",
                    airbnbName: appState.placeName || "",
                    stateCity: appState.location || "",
                    googleMapsLink: originalUrl || "",
                    aiDescription: editableDescription,
                    googleRating: String(appState.rating || ""),
                    googleReviews: String(appState.totalReviews || ""),
                    googlePlaceId: appState.placeId || "",
                    checkInTime: "2:00 PM",
                    checkoutTime: "11:00 AM",
                    host: "fursat",
                    dataSource: "fursatphoto",
                    lastEnriched: new Date().toISOString().split("T")[0],
                  }}
                  onSubmit={handlePublishAndSync}
                  isSubmitting={isPublishing}
                  submitResult={{
                    sheetResult: sheetSyncResult,
                    publishResult: publishResult,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
