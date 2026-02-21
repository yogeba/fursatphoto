import { NextRequest, NextResponse } from "next/server";

interface PublishRequest {
  placeName: string;
  rating: number | null;
  totalReviews: number | null;
  photos: Array<{
    photo_reference: string;
  }>;
  reviews: Array<{
    author_name: string;
    rating: number;
    text: string;
  }>;
  coordinates: {
    lat: number;
    lng: number;
  };
  location: string;
  googleMapsUrl?: string;
  generatedDescription: string;
  hostName?: string;
  hostEmail?: string;
  hostPhone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json();

    const fursatApiUrl = process.env.FURSAT_API_URL || "http://localhost:3001";
    const apiKey = process.env.FURSATPHOTO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "FURSATPHOTO_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Forward to Fursat.fun API
    const response = await fetch(`${fursatApiUrl}/api/fursatphoto/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to publish to Fursat" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error publishing to Fursat:", error);
    return NextResponse.json(
      {
        error: "Failed to publish to Fursat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
