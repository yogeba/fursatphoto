"use client";

import { useState } from "react";
import { PlacePhoto } from "@/types/maps";

interface PhotoGalleryProps {
  photos: PlacePhoto[];
  placeName: string;
  selectedPhotos: Set<string>;
  onTogglePhoto: (ref: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownloadPhoto: (photoReference: string, filename: string) => void;
  onDownloadSelected: () => void;
  isDownloading: boolean;
}

export default function PhotoGallery({
  photos,
  placeName,
  selectedPhotos,
  onTogglePhoto,
  onSelectAll,
  onDeselectAll,
  onDownloadPhoto,
  onDownloadSelected,
  isDownloading,
}: PhotoGalleryProps) {
  const [viewingPhoto, setViewingPhoto] = useState<number | null>(null);
  const allSelected = photos.length > 0 && selectedPhotos.size === photos.length;

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No photos found for this place.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedPhotos.size} of {photos.length} selected
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              (Google limits to 10 photos per place)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={onDownloadSelected}
            disabled={isDownloading || selectedPhotos.size === 0}
            className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg"
          >
            {isDownloading ? "Downloading..." : `Download ${selectedPhotos.size} Photos`}
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {photos.map((photo, index) => {
          const isSelected = selectedPhotos.has(photo.photo_reference);
          return (
            <div
              key={photo.photo_reference}
              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <img
                src={`/api/download-photo?photoReference=${photo.photo_reference}&preview=true`}
                alt={`${placeName} photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onClick={() => setViewingPhoto(index)}
              />

              {/* Selection checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePhoto(photo.photo_reference);
                }}
                className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-white/80 border-gray-400 text-transparent hover:border-blue-400"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </button>

              {/* Download button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadPhoto(
                    photo.photo_reference,
                    `${placeName.replace(/\s+/g, "_")}_photo_${index + 1}.jpg`
                  );
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Full-size modal */}
      {viewingPhoto !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={`/api/download-photo?photoReference=${photos[viewingPhoto].photo_reference}&preview=true`}
              alt={`${placeName} photo ${viewingPhoto + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
