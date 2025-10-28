import { PlaceCoordinates, PlacePhoto } from "@/types/maps";

export function extractLatLng(url: string): PlaceCoordinates | null {
  const match = url.match(/@([-0-9.]+),([-0-9.]+)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }
  return null;
}

export function extractPlaceName(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const placeIndex = pathParts.indexOf("place");

    if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
      return decodeURIComponent(pathParts[placeIndex + 1]).replace(/\+/g, " ");
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
  }
  return null;
}

export function generatePhotoUrl(
  photoReference: string,
  apiKey: string,
  maxWidth: number = 1600
): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return response.blob();
}
