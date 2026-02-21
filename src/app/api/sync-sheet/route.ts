import { NextRequest, NextResponse } from "next/server";
import { SHEET_COLUMN_MAP, SyncSheetResponse } from "@/types/property";
import {
  findPropertyRow,
  appendListingRow,
  updateListingRow,
} from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const { propertyDetails, mode } = await request.json();

    // Build column-name → value map for the sheet
    const sheetValues: Record<string, string> = {};
    for (const [key, colName] of Object.entries(SHEET_COLUMN_MAP)) {
      const value = (propertyDetails as Record<string, unknown>)[key];
      if (typeof value === "boolean") {
        sheetValues[colName] = value ? "Yes" : "No";
      } else {
        sheetValues[colName] = String(value ?? "");
      }
    }

    // Check if property already exists
    const existing = await findPropertyRow(propertyDetails.propertyName);

    if (existing && mode === "create") {
      return NextResponse.json({
        success: true,
        action: "already_exists",
        rowNumber: existing.rowIndex,
      } satisfies SyncSheetResponse);
    }

    if (existing) {
      await updateListingRow(existing.rowIndex, sheetValues);
      return NextResponse.json({
        success: true,
        action: "updated",
        rowNumber: existing.rowIndex,
      } satisfies SyncSheetResponse);
    }

    // Create new row
    const rowNumber = await appendListingRow(sheetValues);
    return NextResponse.json({
      success: true,
      action: "created",
      rowNumber,
    } satisfies SyncSheetResponse);
  } catch (error) {
    console.error("Error syncing to sheet:", error);
    return NextResponse.json(
      {
        success: false,
        action: "created" as const,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
