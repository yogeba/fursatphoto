import { NextRequest, NextResponse } from "next/server";
import { GoogleMapsResponse, SearchPlaceResponse } from "@/types/maps";

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, keyword } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Coordinates are required" },
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

    // Try nearby search first
    const nearbyUrl =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const nearbyParams = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: "2000",
      key: apiKey,
      ...(keyword && { keyword }),
    });

    const nearbyResponse = await fetch(`${nearbyUrl}?${nearbyParams}`);
    const nearbyData: GoogleMapsResponse = await nearbyResponse.json();

    if (nearbyData.results && nearbyData.results.length > 0) {
      // Look for exact match if keyword provided
      if (keyword) {
        const exactMatch = nearbyData.results.find((result) =>
          result.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (exactMatch) {
          const response: SearchPlaceResponse = {
            placeId: exactMatch.place_id,
            placeName: exactMatch.name,
          };
          return NextResponse.json(response);
        }
      }

      // Return first result
      const response: SearchPlaceResponse = {
        placeId: nearbyData.results[0].place_id,
        placeName: nearbyData.results[0].name,
      };
      return NextResponse.json(response);
    }

    // Fallback to text search
    if (keyword) {
      const textUrl =
        "https://maps.googleapis.com/maps/api/place/textsearch/json";
      const textParams = new URLSearchParams({
        query: keyword,
        key: apiKey,
      });

      const textResponse = await fetch(`${textUrl}?${textParams}`);
      const textData: GoogleMapsResponse = await textResponse.json();

      if (textData.results && textData.results.length > 0) {
        const response: SearchPlaceResponse = {
          placeId: textData.results[0].place_id,
          placeName: textData.results[0].name,
        };
        return NextResponse.json(response);
      }
    }

    return NextResponse.json({ error: "No places found" }, { status: 404 });
  } catch (error) {
    console.error("Error searching for place:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
