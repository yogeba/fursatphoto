export interface PropertyDetails {
  propertyName: string;
  airbnbName: string;
  airbnbLink: string;
  googleMapsLink: string;
  stateCity: string;
  contactNumber: string;
  totalRooms: number;
  bathrooms: number;
  beds: number;
  guests: number;
  pricingType: string;
  costPrice: number;
  sellingPrice: number;
  extraGuestPriceAfter: number;
  extraGuestPrice: number;
  petFee: number;
  essentials: boolean;
  wifi: boolean;
  hotWater: boolean;
  petsAllowed: boolean;
  otherAmenities: string;
  aiDescription: string;
  googleRating: string;
  googleReviews: string;
  googlePlaceId: string;
  lastEnriched: string;
  cancellationPolicy: string;
  upiId: string;
}

export const PRICING_TYPES = [
  "Room Wise",
  "Per Person",
  "Entire Property",
] as const;

export const PROPERTY_TYPES = [
  "Villa",
  "Cottage",
  "Apartment",
  "Homestay",
  "Bungalow",
  "Farmhouse",
  "Treehouse",
  "Camp",
  "Resort",
  "Guest House",
] as const;

export const AMENITY_OPTIONS = [
  { key: "wifi" as const, label: "WiFi" },
  { key: "hotWater" as const, label: "Hot Water" },
  { key: "essentials" as const, label: "Essentials" },
  { key: "petsAllowed" as const, label: "Pets Allowed" },
] as const;

// Maps PropertyDetails keys to EXACT column headers in the real Listings sheet.
// Trailing spaces on column names are intentional — they match the actual sheet.
export const SHEET_COLUMN_MAP: Record<string, string> = {
  propertyName: "Property Name",
  airbnbName: "Airbnb Name ",
  airbnbLink: "Airbnb Link",
  googleMapsLink: "Google Maps Link",
  stateCity: "State/City",
  contactNumber: "Contact Number",
  totalRooms: "Total Rooms",
  bathrooms: "Bathroom ",
  beds: "Beds",
  guests: "Guests",
  pricingType: "Pricing Type",
  costPrice: "Cost Price ",
  sellingPrice: "Selling Price",
  extraGuestPriceAfter: "Extra Guest Price applies after ",
  extraGuestPrice: "Extra Guest Price",
  petFee: "Pet Fee",
  essentials: "Essentials",
  wifi: "Wifi",
  hotWater: "Hot Water",
  petsAllowed: "Pets Allowed",
  otherAmenities: "Any other amenities",
  aiDescription: "AI Description",
  googleRating: "Google Rating",
  googleReviews: "Google Reviews",
  googlePlaceId: "Property ID ",
  lastEnriched: "Last Enriched",
  cancellationPolicy: "Cancellation Policy",
  upiId: "UPI ID ",
};

export interface SyncSheetResponse {
  success: boolean;
  action: "created" | "updated" | "already_exists";
  rowNumber?: number;
  error?: string;
}
