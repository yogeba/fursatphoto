import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Test with a simple Places API call
    const testUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      apiKeyConfigured: true,
      apiResponse: data.status,
      message: data.status === "OK" ? "API key is working!" : `API error: ${data.status}`,
      errorMessage: data.error_message || null
    });
  } catch (error) {
    console.error("Error testing API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
