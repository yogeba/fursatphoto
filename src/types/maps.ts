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

export interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export interface PlaceDetails {
  name: string;
  photos: PlacePhoto[];
  reviews?: PlaceReview[];
  rating?: number;
  user_ratings_total?: number;
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
  loadingMessage: string | null;
  error: string | null;
  placeName: string | null;
  placeId: string | null;
  photos: PlacePhoto[];
  selectedPhotos: Set<string>;
  reviews: PlaceReview[];
  rating: number | null;
  totalReviews: number | null;
  generatedDescription: string | null;
  isGeneratingDescription: boolean;
  coordinates: PlaceCoordinates | null;
  location: string | null;
}
