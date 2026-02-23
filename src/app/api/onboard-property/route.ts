import { NextRequest, NextResponse } from "next/server";
import { extractLatLng, extractPlaceName } from "@/lib/maps-utils";
import { PlaceReview } from "@/types/maps";
import { SHEET_COLUMN_MAP } from "@/types/property";
import { findPropertyRow, appendListingRow } from "@/lib/google-sheets";

interface OnboardRequest {
  googleMapsUrl: string;
  contactNumber?: string;
  // Optional overrides from WhatsApp reply or manual input
  totalRooms?: number;
  beds?: number;
  bathrooms?: number;
  guests?: number;
  costPrice?: number;
  sellingPrice?: number;
  pricingType?: string;
  // Skip individual steps
  skipDescription?: boolean;
  skipSheet?: boolean;
  skipFursat?: boolean;
}

export async function POST(request: NextRequest) {
  const steps: string[] = [];

  try {
    const body: OnboardRequest = await request.json();

    if (!body.googleMapsUrl) {
      return NextResponse.json({ error: "googleMapsUrl is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });
    }

    // Step 1: Extract coordinates + name from URL
    const coordinates = extractLatLng(body.googleMapsUrl);
    const placeName = extractPlaceName(body.googleMapsUrl);

    if (!coordinates || !placeName) {
      return NextResponse.json(
        { error: "Could not parse Google Maps URL. Needs /place/ and @coordinates." },
        { status: 400 }
      );
    }
    steps.push(`Parsed URL: ${placeName}`);

    // Step 2: Nearby search → Place ID
    const nearbyUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const nearbyParams = new URLSearchParams({
      location: `${coordinates.lat},${coordinates.lng}`,
      radius: "2000",
      keyword: placeName,
      key: apiKey,
    });

    const nearbyResponse = await fetch(`${nearbyUrl}?${nearbyParams}`);
    const nearbyData = await nearbyResponse.json();

    let placeId: string | null = null;
    let resolvedName = placeName;

    if (nearbyData.results?.length > 0) {
      // Try exact match first
      const exactMatch = nearbyData.results.find(
        (r: { name: string }) => r.name.toLowerCase().includes(placeName.toLowerCase())
      );
      const best = exactMatch || nearbyData.results[0];
      placeId = best.place_id;
      resolvedName = best.name;
    }

    // Fallback: text search
    if (!placeId) {
      const textUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
      const textParams = new URLSearchParams({ query: placeName, key: apiKey });
      const textResponse = await fetch(`${textUrl}?${textParams}`);
      const textData = await textResponse.json();

      if (textData.results?.length > 0) {
        placeId = textData.results[0].place_id;
        resolvedName = textData.results[0].name;
      }
    }

    if (!placeId) {
      return NextResponse.json({ error: `No Google Place found for "${placeName}"`, steps }, { status: 404 });
    }
    steps.push(`Found Place ID: ${placeId}`);

    // Step 3: Place details → photos, reviews, rating, phone, website
    const detailsUrl = "https://maps.googleapis.com/maps/api/place/details/json";
    const detailsParams = new URLSearchParams({
      place_id: placeId,
      fields: "name,photos,reviews,rating,user_ratings_total,formatted_phone_number,international_phone_number,website",
      key: apiKey,
    });

    const detailsResponse = await fetch(`${detailsUrl}?${detailsParams}`);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      return NextResponse.json({ error: `Place details failed: ${detailsData.status}`, steps }, { status: 400 });
    }

    const details = detailsData.result;
    const photos = details.photos || [];
    const reviews: PlaceReview[] = details.reviews || [];
    const rating = details.rating || null;
    const totalReviews = details.user_ratings_total || null;
    const phoneNumber = details.international_phone_number || details.formatted_phone_number || body.contactNumber || "";
    const website = details.website || "";

    steps.push(`Got ${photos.length} photos, ${reviews.length} reviews, phone: ${phoneNumber || "none"}`);

    // Step 4: Generate AI description + inferred data
    let description = "";
    let inferredData: Record<string, unknown> | null = null;

    if (!body.skipDescription && reviews.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const descResult = await generateDescription(reviews, rating, totalReviews, resolvedName, geminiKey);
          description = descResult.description;
          inferredData = descResult.inferredData;
          steps.push("Generated AI description");
        } catch (e) {
          steps.push(`AI description failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      } else {
        steps.push("Skipped AI description (no GEMINI_API_KEY)");
      }
    } else {
      steps.push(body.skipDescription ? "Skipped AI description (requested)" : "Skipped AI description (no reviews)");
    }

    // Build property details for sheet
    const propertyDetails: Record<string, unknown> = {
      propertyName: resolvedName,
      airbnbName: resolvedName,
      googleMapsLink: body.googleMapsUrl,
      stateCity: inferredData?.stateCity || "",
      contactNumber: phoneNumber,
      googlePlaceId: placeId,
      googleRating: rating ? String(rating) : "",
      googleReviews: totalReviews ? String(totalReviews) : "",
      aiDescription: description,
      lastEnriched: new Date().toISOString().split("T")[0],
      // Overrides from caller (WhatsApp reply data, etc.)
      totalRooms: body.totalRooms ?? inferredData?.totalRooms ?? 0,
      beds: body.beds ?? inferredData?.beds ?? 0,
      bathrooms: body.bathrooms ?? inferredData?.bathrooms ?? 0,
      guests: body.guests ?? inferredData?.guests ?? 0,
      costPrice: body.costPrice ?? 0,
      sellingPrice: body.sellingPrice ?? (body.costPrice ? Math.round(body.costPrice * 1.5) : 0),
      pricingType: body.pricingType ?? inferredData?.pricingType ?? "",
      wifi: inferredData?.wifi ?? false,
      hotWater: inferredData?.hotWater ?? false,
      petsAllowed: inferredData?.petsAllowed ?? false,
      essentials: false,
      otherAmenities: inferredData?.otherAmenities ?? "",
      airbnbLink: "",
      extraGuestPriceAfter: 0,
      extraGuestPrice: 0,
      petFee: 0,
      cancellationPolicy: "",
      upiId: "",
    };

    // Step 5: Sync to Google Sheet
    let sheetResult: { action: string; rowNumber?: number } | null = null;

    if (!body.skipSheet) {
      try {
        const sheetValues: Record<string, string> = {};
        for (const [key, colName] of Object.entries(SHEET_COLUMN_MAP)) {
          const value = propertyDetails[key];
          if (typeof value === "boolean") {
            sheetValues[colName] = value ? "Yes" : "No";
          } else if (typeof value === "number") {
            sheetValues[colName] = value === 0 ? "" : String(value);
          } else {
            sheetValues[colName] = String(value ?? "");
          }
        }

        const existing = await findPropertyRow(resolvedName, placeId);
        if (existing) {
          sheetResult = { action: "already_exists", rowNumber: existing.rowIndex };
          steps.push(`Sheet: already exists at row ${existing.rowIndex}`);
        } else {
          const rowNumber = await appendListingRow(sheetValues);
          sheetResult = { action: "created", rowNumber };
          steps.push(`Sheet: created at row ${rowNumber}`);
        }
      } catch (e) {
        steps.push(`Sheet sync failed: ${e instanceof Error ? e.message : "unknown"}`);
      }
    } else {
      steps.push("Skipped sheet sync (requested)");
    }

    // Step 6: Publish to Fursat.fun
    let fursatResult: { listingId?: string; editUrl?: string } | null = null;

    if (!body.skipFursat) {
      const fursatApiUrl = process.env.FURSAT_API_URL;
      const fursatApiKey = process.env.FURSATPHOTO_API_KEY;

      if (fursatApiUrl && fursatApiKey) {
        try {
          const fursatResponse = await fetch(`${fursatApiUrl}/api/fursatphoto/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placeName: resolvedName,
              rating,
              totalReviews,
              photos: photos.slice(0, 10),
              reviews,
              coordinates,
              location: placeName,
              googleMapsUrl: body.googleMapsUrl,
              generatedDescription: description,
              apiKey: fursatApiKey,
            }),
          });

          if (fursatResponse.ok) {
            fursatResult = await fursatResponse.json();
            steps.push("Published to Fursat.fun");
          } else {
            const err = await fursatResponse.json().catch(() => ({}));
            steps.push(`Fursat publish failed: ${(err as { error?: string }).error || fursatResponse.status}`);
          }
        } catch (e) {
          steps.push(`Fursat publish failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      } else {
        steps.push("Skipped Fursat publish (no FURSAT_API_URL or FURSATPHOTO_API_KEY)");
      }
    } else {
      steps.push("Skipped Fursat publish (requested)");
    }

    return NextResponse.json({
      success: true,
      property: {
        name: resolvedName,
        placeId,
        coordinates,
        phoneNumber,
        website,
        rating,
        totalReviews,
        photoCount: photos.length,
        photoReferences: photos.slice(0, 10).map((p: { photo_reference: string }) => p.photo_reference),
      },
      description: description || null,
      inferredData,
      sheet: sheetResult,
      fursat: fursatResult,
      steps,
    });
  } catch (error) {
    console.error("Error in onboard-property:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error", steps },
      { status: 500 }
    );
  }
}

// Inline description generation (same logic as generate-description route)
async function generateDescription(
  reviews: PlaceReview[],
  rating: number | null,
  totalReviews: number | null,
  placeName: string,
  geminiKey: string
): Promise<{ description: string; inferredData: Record<string, unknown> | null }> {
  const reviewsText = reviews
    .map((r) => `- "${r.text}" (Rating: ${r.rating}/5, by ${r.author_name})`)
    .join("\n\n");

  const prompt = `Create an SEO optimised and Airbnb best practices, listing title and description based on reviews. Do not use the stay name in the name or description.

Place Rating: ${rating || "N/A"}/5
Total Reviews: ${totalReviews || reviews.length}

Reviews:
${reviewsText}

Rules:
- Do NOT use the actual place name "${placeName}" in the title or description
- Create a compelling, SEO-friendly title
- Extract real quotes from the reviews
- Infer amenities and experiences from what reviewers mention
- AVOID generic overused terms like: serene, tranquil, nestled, tucked away, hidden gem, oasis, paradise, picturesque
- Use SPECIFIC, CONCRETE descriptions from actual reviews
- Mirror the voice and language of real guests

AFTER the listing description, add "---PROPERTY_DATA---" then a JSON object:

CRITICAL: Return null for ANY field not clearly stated in reviews. Do NOT guess room/bed/bathroom counts or pricing.

{"totalRooms":null,"beds":null,"bathrooms":null,"guests":null,"pricingType":null,"wifi":true/false/null,"hotWater":true/false/null,"petsAllowed":true/false/null,"stateCity":"name or null","otherAmenities":"comma-separated or null"}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`;

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  });

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawText) throw new Error("No content generated");

  let description = rawText;
  let inferredData = null;
  const separatorIndex = rawText.indexOf("---PROPERTY_DATA---");
  if (separatorIndex !== -1) {
    description = rawText.substring(0, separatorIndex).trim();
    const jsonPart = rawText.substring(separatorIndex + "---PROPERTY_DATA---".length);
    try {
      const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
      if (jsonMatch) inferredData = JSON.parse(jsonMatch[0]);
    } catch {
      // Non-critical
    }
  }

  return { description, inferredData };
}
