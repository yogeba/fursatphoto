import { NextRequest, NextResponse } from "next/server";
import { extractLatLng, extractPlaceName } from "@/lib/maps-utils";
import { ExtractPlaceResponse } from "@/types/maps";

function isShortUrl(url: string): boolean {
  return (
    url.includes("maps.app.goo.gl") ||
    url.includes("goo.gl/maps")
  );
}

// For shortened URLs, try to resolve by fetching with browser-like headers
async function resolveShortUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });
    const location = response.headers.get("location");
    if (location && (location.includes("/place/") || location.includes("@"))) {
      return location;
    }
    // Some redirects go through consent pages — try following chain
    if (location) {
      const res2 = await fetch(location, { redirect: "manual" });
      const loc2 = res2.headers.get("location");
      if (loc2 && (loc2.includes("/place/") || loc2.includes("@"))) {
        return loc2;
      }
    }
  } catch {
    // Short URL resolution failed
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url;

    // Try resolving shortened URLs
    if (isShortUrl(url)) {
      const resolved = await resolveShortUrl(url);
      if (resolved) {
        targetUrl = resolved;
      } else {
        return NextResponse.json(
          { error: "Shortened Google Maps links can't be resolved server-side. Please paste the full URL from your browser address bar (it should contain /place/ and @coordinates)." },
          { status: 400 }
        );
      }
    }

    const coordinates = extractLatLng(targetUrl);
    const placeName = extractPlaceName(targetUrl);

    if (!coordinates || !placeName) {
      return NextResponse.json(
        { error: "Could not parse this URL. Make sure it's a Google Maps place URL containing /place/ and @coordinates in the address bar." },
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
