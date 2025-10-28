import { NextRequest, NextResponse } from "next/server";
import { extractLatLng, extractPlaceName } from "@/lib/maps-utils";
import { ExtractPlaceResponse } from "@/types/maps";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const coordinates = extractLatLng(url);
    const placeName = extractPlaceName(url);

    if (!coordinates || !placeName) {
      return NextResponse.json(
        { error: "Could not extract coordinates or place name from URL" },
        { status: 400 }
      );
    }

    const response: ExtractPlaceResponse = {
      coordinates,
      placeName,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error extracting place data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
