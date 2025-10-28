"use client";

import { useState } from "react";
import URLInput from "@/components/URLInput";
import PhotoGallery from "@/components/PhotoGallery";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  AppState,
  PlacePhoto,
  ExtractPlaceResponse,
  SearchPlaceResponse,
  PlaceDetails,
} from "@/types/maps";
import JSZip from "jszip";

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    isLoading: false,
    error: null,
    placeName: null,
    photos: [],
    currentStep: "input",
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleURLSubmit = async (url: string) => {
    setAppState({
      isLoading: true,
      error: null,
      placeName: null,
      photos: [],
      currentStep: "loading",
    });

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

      setAppState({
        isLoading: false,
        error: null,
        placeName: detailsData.name,
        photos: detailsData.photos || [],
        currentStep: "gallery",
      });
    } catch (error) {
      setAppState({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        placeName: null,
        photos: [],
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

  const resetApp = () => {
    setAppState({
      isLoading: false,
      error: null,
      placeName: null,
      photos: [],
      currentStep: "input",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Fursat Photo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Extract and download photos from Google Maps places with ease
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {appState.currentStep === "input" && (
            <div className="fade-in">
              <URLInput
                onSubmit={handleURLSubmit}
                isLoading={appState.isLoading}
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
                Try Again
              </button>
            </div>
          )}

          {appState.currentStep === "gallery" && (
            <div className="space-y-6 slide-up">
              <PhotoGallery
                photos={appState.photos}
                placeName={appState.placeName || ""}
                onDownloadPhoto={handleDownloadPhoto}
                onDownloadAll={handleDownloadAll}
                isDownloading={isDownloading}
              />

              <div className="text-center pt-6">
                <button
                  onClick={resetApp}
                  className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl button-press"
                >
                  Extract Another Place
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
