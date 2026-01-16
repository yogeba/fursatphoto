"use client";

import { useState, useEffect } from "react";
import URLInput from "@/components/URLInput";
import PhotoGallery from "@/components/PhotoGallery";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  AppState,
  ExtractPlaceResponse,
  SearchPlaceResponse,
  PlaceDetails,
} from "@/types/maps";
import JSZip from "jszip";

const STORAGE_KEY = "fursatphoto_generate_description";

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    isLoading: false,
    error: null,
    placeName: null,
    photos: [],
    reviews: [],
    rating: null,
    totalReviews: null,
    generatedDescription: null,
    isGeneratingDescription: false,
    coordinates: null,
    location: null,
    currentStep: "input",
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; listingId?: string; editUrl?: string; error?: string } | null>(null);
  const [enableDescription, setEnableDescription] = useState(true);

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setEnableDescription(saved === "true");
    }
  }, []);

  // Save preference to localStorage when it changes
  const toggleDescription = () => {
    const newValue = !enableDescription;
    setEnableDescription(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  const handleURLSubmit = async (url: string) => {
    setAppState({
      isLoading: true,
      error: null,
      placeName: null,
      photos: [],
      reviews: [],
      rating: null,
      totalReviews: null,
      generatedDescription: null,
      isGeneratingDescription: false,
      coordinates: null,
      location: null,
      currentStep: "loading",
    });
    setPublishResult(null);

    try {
      // Step 1: Extract place data
      const extractResponse = await fetch("/api/extract-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || "Failed to extract place data");
      }

      const extractData: ExtractPlaceResponse = await extractResponse.json();

      // Step 2: Search for place
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
        throw new Error(errorData.error || "Failed to find place");
      }

      const searchData: SearchPlaceResponse = await searchResponse.json();

      // Step 3: Get place details
      const detailsResponse = await fetch("/api/place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: searchData.placeId }),
      });

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        throw new Error(errorData.error || "Failed to get place details");
      }

      const detailsData: PlaceDetails = await detailsResponse.json();

      // Set initial state with photos and reviews
      setAppState({
        isLoading: false,
        error: null,
        placeName: detailsData.name,
        photos: detailsData.photos || [],
        reviews: enableDescription ? (detailsData.reviews || []) : [],
        rating: enableDescription ? (detailsData.rating || null) : null,
        totalReviews: enableDescription ? (detailsData.user_ratings_total || null) : null,
        generatedDescription: null,
        isGeneratingDescription: enableDescription && (detailsData.reviews?.length ?? 0) > 0,
        coordinates: extractData.coordinates,
        location: extractData.placeName,
        currentStep: "gallery",
      });

      // Step 4: Generate Airbnb description (async, don't block UI)
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
            setAppState((prev) => ({
              ...prev,
              generatedDescription: descData.description,
              isGeneratingDescription: false,
            }));
          } else {
            setAppState((prev) => ({
              ...prev,
              isGeneratingDescription: false,
            }));
          }
        } catch {
          setAppState((prev) => ({
            ...prev,
            isGeneratingDescription: false,
          }));
        }
      }
    } catch (error) {
      setAppState({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        placeName: null,
        photos: [],
        reviews: [],
        rating: null,
        totalReviews: null,
        generatedDescription: null,
        isGeneratingDescription: false,
        coordinates: null,
        location: null,
        currentStep: "error",
      });
    }
  };

  const handleDownloadPhoto = async (
    photoReference: string,
    filename: string
  ) => {
    try {
      const response = await fetch("/api/download-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoReference, filename }),
      });

      if (!response.ok) {
        throw new Error("Failed to download photo");
      }

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
      alert("Failed to download photo");
    }
  };

  const handleDownloadAll = async () => {
    if (appState.photos.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const placeName = appState.placeName?.replace(/\s+/g, "_") || "place";

      // Download all photos and add to zip
      const downloadPromises = appState.photos.map(async (photo, index) => {
        const response = await fetch("/api/download-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoReference: photo.photo_reference,
            filename: `${placeName}_photo_${index + 1}.jpg`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to download photo ${index + 1}`);
        }

        const blob = await response.blob();
        zip.file(`${placeName}_photo_${index + 1}.jpg`, blob);
      });

      await Promise.all(downloadPromises);

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${placeName}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading photos:", error);
      alert("Failed to download photos");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePublishToFursat = async () => {
    if (!appState.placeName || !appState.generatedDescription) {
      alert("Please wait for the description to be generated before publishing.");
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      const response = await fetch("/api/publish-to-fursat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName: appState.placeName,
          rating: appState.rating,
          totalReviews: appState.totalReviews,
          photos: appState.photos,
          reviews: appState.reviews,
          coordinates: appState.coordinates,
          location: appState.location || appState.placeName,
          generatedDescription: appState.generatedDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPublishResult({ success: false, error: data.error || "Failed to publish" });
      } else {
        setPublishResult({
          success: true,
          listingId: data.listingId,
          editUrl: data.editUrl,
        });
      }
    } catch (error) {
      setPublishResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const resetApp = () => {
    setAppState({
      isLoading: false,
      error: null,
      placeName: null,
      photos: [],
      reviews: [],
      rating: null,
      totalReviews: null,
      generatedDescription: null,
      isGeneratingDescription: false,
      coordinates: null,
      location: null,
      currentStep: "input",
    });
    setPublishResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            📸 Fursat Photo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Extract and download high-quality photos from any Google Maps place in seconds
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {appState.currentStep === "input" && (
            <div className="fade-in">
              <URLInput
                onSubmit={handleURLSubmit}
                isLoading={appState.isLoading}
                enableDescription={enableDescription}
                onToggleDescription={toggleDescription}
              />
            </div>
          )}

          {appState.currentStep === "loading" && (
            <div className="fade-in">
              <LoadingSpinner message="Extracting place information..." />
            </div>
          )}

          {appState.currentStep === "error" && (
            <div className="text-center py-12 fade-in">
              <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {appState.error}
              </p>
              <button
                onClick={resetApp}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl button-press"
              >
                🔄 Try Again
              </button>
            </div>
          )}

          {appState.currentStep === "gallery" && (
            <div className="space-y-6 slide-up">
              {/* Place Info Header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {appState.placeName}
                    </h2>
                    {appState.rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500 text-xl">⭐</span>
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {appState.rating.toFixed(1)}
                        </span>
                        {appState.totalReviews && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ({appState.totalReviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {appState.photos.length} photos
                    </span>
                    {appState.reviews.length > 0 && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        {appState.reviews.length} reviews loaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Gallery */}
              <PhotoGallery
                photos={appState.photos}
                placeName={appState.placeName || ""}
                onDownloadPhoto={handleDownloadPhoto}
                onDownloadAll={handleDownloadAll}
                isDownloading={isDownloading}
              />

              {/* Generated Description Section - only show if description generation was enabled */}
              {(appState.isGeneratingDescription || appState.generatedDescription || appState.reviews.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      ✨ AI-Generated Airbnb Description
                    </h3>
                    {appState.generatedDescription && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(appState.generatedDescription || "");
                          alert("Description copied to clipboard!");
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg button-press"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>

                  {appState.isGeneratingDescription ? (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span>Generating description from reviews...</span>
                    </div>
                  ) : appState.generatedDescription ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-xl overflow-auto max-h-96">
                        {appState.generatedDescription}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Failed to generate description. Please try again.
                    </p>
                  )}
                </div>
              )}

              {/* Publish to Fursat Section */}
              {appState.generatedDescription && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-1">
                        Publish to Fursat.fun
                      </h3>
                      <p className="text-purple-100 text-sm">
                        Create a draft listing on Fursat.fun with all the photos and generated description
                      </p>
                    </div>
                    <button
                      onClick={handlePublishToFursat}
                      disabled={isPublishing || publishResult?.success}
                      className={`px-6 py-3 font-medium rounded-xl button-press flex items-center gap-2 ${
                        publishResult?.success
                          ? "bg-green-500 text-white cursor-default"
                          : isPublishing
                          ? "bg-white/50 text-purple-700 cursor-wait"
                          : "bg-white text-purple-700 hover:bg-purple-50"
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                          <span>Publishing...</span>
                        </>
                      ) : publishResult?.success ? (
                        <>
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <span>Publish to Fursat</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Publish Result */}
                  {publishResult && (
                    <div className={`mt-4 p-4 rounded-xl ${
                      publishResult.success
                        ? "bg-green-500/20 text-white"
                        : "bg-red-500/20 text-white"
                    }`}>
                      {publishResult.success ? (
                        <div>
                          <p className="font-medium mb-2">Listing created successfully!</p>
                          <p className="text-sm text-purple-100">
                            Your draft listing has been created. You can edit it on Fursat.fun.
                          </p>
                          {publishResult.editUrl && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_FURSAT_URL || 'http://localhost:3001'}${publishResult.editUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 px-4 py-2 bg-white text-purple-700 font-medium rounded-lg hover:bg-purple-50"
                            >
                              Edit Listing
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium">Error: {publishResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pt-6">
                <button
                  onClick={resetApp}
                  className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl button-press"
                >
                  🔄 Extract Another Place
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
