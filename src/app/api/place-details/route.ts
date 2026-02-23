import { NextRequest, NextResponse } from "next/server";
import { PlaceDetailsResponse } from "@/types/maps";

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = new URLSearchParams({
      place_id: placeId,
      fields: "name,photos,reviews,rating,user_ratings_total,formatted_phone_number,international_phone_number,website",
      key: apiKey,
    });

    const response = await fetch(`${url}?${params}`);
    const data: PlaceDetailsResponse = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json(data.result);
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
