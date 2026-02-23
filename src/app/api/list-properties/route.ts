import { NextResponse } from "next/server";
import { getListingsRows } from "@/lib/google-sheets";
import { MongoClient } from "mongodb";

interface Property {
  propertyName: string;
  placeId: string;
  airbnbName: string;
  airbnbLink: string;
  stateCity: string;
  source: "sheet" | "mongodb" | "both";
}

async function getSheetProperties(): Promise<Property[]> {
  try {
    const rows = await getListingsRows();
    if (rows.length < 2) return [];

    const headers = rows[0];
    const nameCol = headers.findIndex(h => h.trim().toLowerCase() === "property name");
    const idCol = headers.findIndex(h => h.trim().toLowerCase() === "property id");
    const airbnbNameCol = headers.findIndex(h => h.trim().toLowerCase().startsWith("airbnb name"));
    const airbnbLinkCol = headers.findIndex(h => h.trim().toLowerCase() === "airbnb link");
    const stateCityCol = headers.findIndex(h => h.trim().toLowerCase() === "state/city");

    const properties: Property[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = nameCol !== -1 ? (row[nameCol] || "").trim() : "";
      if (!name) continue;

      properties.push({
        propertyName: name,
        placeId: idCol !== -1 ? (row[idCol] || "").trim() : "",
        airbnbName: airbnbNameCol !== -1 ? (row[airbnbNameCol] || "").trim() : "",
        airbnbLink: airbnbLinkCol !== -1 ? (row[airbnbLinkCol] || "").trim() : "",
        stateCity: stateCityCol !== -1 ? (row[stateCityCol] || "").trim() : "",
        source: "sheet",
      });
    }
    return properties;
  } catch (error) {
    console.error("Error fetching sheet properties:", error);
    return [];
  }
}

async function getMongoProperties(): Promise<Property[]> {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.warn("DATABASE_URL not set, skipping MongoDB dedup");
    return [];
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(); // uses db from connection string ("test1")
    const listings = await db.collection("Listing").find(
      { status: { $ne: "deleted" } },
      { projection: { title: 1, stayName: 1, location: 1, _id: 0 } }
    ).toArray();

    return listings.map(l => ({
      propertyName: (l.stayName || l.title || "").trim(),
      placeId: "",
      airbnbName: (l.title || "").trim(),
      airbnbLink: "",
      stateCity: (l.location || "").trim(),
      source: "mongodb" as const,
    })).filter(p => p.propertyName);
  } catch (error) {
    console.error("Error fetching MongoDB properties:", error);
    return [];
  } finally {
    await client.close();
  }
}

export async function GET() {
  try {
    // Fetch from both sources in parallel
    const [sheetProps, mongoProps] = await Promise.all([
      getSheetProperties(),
      getMongoProperties(),
    ]);

    // Merge and deduplicate by property name (case-insensitive)
    const seen = new Map<string, Property>();

    for (const p of sheetProps) {
      seen.set(p.propertyName.toLowerCase(), p);
    }

    for (const p of mongoProps) {
      const key = p.propertyName.toLowerCase();
      if (seen.has(key)) {
        // Property exists in both — mark as "both"
        seen.get(key)!.source = "both";
      } else {
        seen.set(key, p);
      }
    }

    const properties = Array.from(seen.values());

    return NextResponse.json({
      count: properties.length,
      sources: {
        sheet: sheetProps.length,
        mongodb: mongoProps.length,
      },
      properties,
    });
  } catch (error) {
    console.error("Error listing properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
