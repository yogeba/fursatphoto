export interface PropertyDetails {
  propertyName: string;
  airbnbName: string;
  internalName: string;
  airbnbLink: string;
  googleMapsLink: string;
  stateCity: string;
  contactNumber: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  basePrice: number;
  sellingPrice: number;
  propertyType: string;
  description: string;
  highlights: string;
  amenities: string;
  checkInTime: string;
  checkoutTime: string;
  parking: string;
  kitchenDetails: string;
  houseRules: string;
  viewLocation: string;
  specialFeatures: string;
  bedConfiguration: string;
  wifi: boolean;
  hotWater: boolean;
  essentials: boolean;
  petsAllowed: boolean;
  aiDescription: string;
  googleRating: string;
  googleReviews: string;
  dataSource: string;
  lastEnriched: string;
  host: string;
}

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

// Maps PropertyDetails keys to exact column header names in the Listings sheet.
// "Airbnb Name " has a trailing space matching the fursatagent sheet.
export const SHEET_COLUMN_MAP: Record<string, string> = {
  propertyName: "Property Name",
  airbnbName: "Airbnb Name ",
  internalName: "Internal Name",
  airbnbLink: "Airbnb Link",
  googleMapsLink: "Google Maps Link",
  stateCity: "State/City",
  contactNumber: "Contact Number",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  maxGuests: "Max Guests",
  basePrice: "Base Price",
  sellingPrice: "Selling Price",
  propertyType: "Property Type",
  description: "Description",
  highlights: "Highlights",
  amenities: "Amenities",
  checkInTime: "Check-in Time",
  checkoutTime: "Checkout Time",
  parking: "Parking",
  kitchenDetails: "Kitchen Details",
  houseRules: "House Rules",
  viewLocation: "View/Location",
  specialFeatures: "Special Features",
  bedConfiguration: "Bed Configuration",
  wifi: "Wifi",
  hotWater: "Hot Water",
  essentials: "Essentials",
  petsAllowed: "Pets Allowed",
  aiDescription: "AI Description",
  googleRating: "Google Rating",
  googleReviews: "Google Reviews",
  dataSource: "Data Source",
  lastEnriched: "Last Enriched",
};

export interface SyncSheetResponse {
  success: boolean;
  action: "created" | "updated" | "already_exists";
  rowNumber?: number;
  error?: string;
}
