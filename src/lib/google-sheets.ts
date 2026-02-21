import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

function getAuth() {
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!credentialsBase64) {
    throw new Error("GOOGLE_CREDENTIALS_JSON not configured");
  }
  const credentials = JSON.parse(
    Buffer.from(credentialsBase64, "base64").toString("utf-8")
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id) {
    throw new Error("SPREADSHEET_ID not configured");
  }
  return id;
}

export async function getListingsRows(): Promise<string[][]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "Listings",
  });
  return response.data.values || [];
}

export async function findPropertyRow(
  propertyName: string,
  googlePlaceId?: string
): Promise<{ rowIndex: number; rowData: Record<string, string> } | null> {
  const rows = await getListingsRows();
  if (rows.length < 2) return null;

  const headers = rows[0];
  const propertyNameColIndex = headers.findIndex(
    (h) => h.trim().toLowerCase() === "property name"
  );
  const placeIdColIndex = headers.findIndex(
    (h) => h.trim().toLowerCase() === "google place id"
  );

  const buildRowData = (i: number) => {
    const rowData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowData[h] = rows[i][idx] || "";
    });
    return rowData;
  };

  // First: match by Google Place ID (most reliable)
  if (googlePlaceId && placeIdColIndex !== -1) {
    for (let i = 1; i < rows.length; i++) {
      const cellValue = (rows[i][placeIdColIndex] || "").trim();
      if (cellValue === googlePlaceId) {
        return { rowIndex: i + 1, rowData: buildRowData(i) };
      }
    }
  }

  // Fallback: match by Property Name (case-insensitive)
  if (propertyNameColIndex !== -1) {
    const searchName = propertyName.trim().toLowerCase();
    for (let i = 1; i < rows.length; i++) {
      const cellValue = (rows[i][propertyNameColIndex] || "").trim().toLowerCase();
      if (cellValue === searchName) {
        return { rowIndex: i + 1, rowData: buildRowData(i) };
      }
    }
  }

  return null;
}

export async function appendListingRow(
  values: Record<string, string>
): Promise<number> {
  const rows = await getListingsRows();
  const headers = rows[0] || [];
  const newRow = headers.map((h) => values[h] || "");

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "Listings",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [newRow] },
  });
  return rows.length + 1;
}

function columnToLetter(col: number): string {
  let letter = "";
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

export async function updateListingRow(
  rowIndex: number,
  values: Record<string, string>
): Promise<void> {
  const rows = await getListingsRows();
  const headers = rows[0] || [];
  const updatedRow = headers.map((h) => values[h] || "");

  const sheets = getSheetsClient();
  const lastCol = columnToLetter(headers.length);
  const range = `Listings!A${rowIndex}:${lastCol}${rowIndex}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updatedRow] },
  });
}
