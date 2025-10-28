export interface PlaceCoordinates {
  lat: number;
  lng: number;
}

export interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface PlaceDetails {
  name: string;
  photos: PlacePhoto[];
}

export interface GoogleMapsResponse {
  results: Array<{
    place_id: string;
    name: string;
    geometry: {
      location: PlaceCoordinates;
    };
  }>;
  status: string;
}

export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
}

export interface ExtractPlaceResponse {
  coordinates: PlaceCoordinates;
  placeName: string;
}

export interface SearchPlaceResponse {
  placeId: string;
  placeName: string;
}

export interface PhotoDownloadResponse {
  url: string;
  filename: string;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  placeName: string | null;
  photos: PlacePhoto[];
  currentStep: "input" | "loading" | "gallery" | "error";
}
