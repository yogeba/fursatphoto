"use client";

import { useState } from "react";
import { PlacePhoto } from "@/types/maps";
import { generatePhotoUrl } from "@/lib/maps-utils";

interface PhotoGalleryProps {
  photos: PlacePhoto[];
  placeName: string;
  onDownloadPhoto: (photoReference: string, filename: string) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
}

export default function PhotoGallery({
  photos,
  placeName,
  onDownloadPhoto,
  onDownloadAll,
  isDownloading,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          No photos found for this place.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {placeName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            📊 {photos.length} photo{photos.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <button
          onClick={onDownloadAll}
          disabled={isDownloading}
          className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {isDownloading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Downloading...</span>
            </div>
            ) : (
              "📦 Download All"
            )}
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.photo_reference}
            className="photo-item group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden cursor-pointer card-hover"
            onClick={() => setSelectedPhoto(index)}
          >
            <img
              src={`/api/download-photo?photoReference=${photo.photo_reference}&preview=true`}
              alt={`${placeName} photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadPhoto(
                      photo.photo_reference,
                      `${placeName.replace(/\s+/g, "_")}_photo_${index + 1}.jpg`
                    );
                  }}
                  className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for full-size photo */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={`/api/download-photo?photoReference=${photos[selectedPhoto].photo_reference}&preview=true`}
                alt={`${placeName} photo ${selectedPhoto + 1}`}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
