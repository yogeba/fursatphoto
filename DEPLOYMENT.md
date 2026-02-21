# Deployment Guide

## Vercel (Production)

The app is deployed at [fursatphoto.vercel.app](https://fursatphoto.vercel.app). Pushes to `main` auto-deploy.

### Environment Variables

Set all of these in Vercel → Project → Settings → Environment Variables:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GOOGLE_MAPS_API_KEY` | Google Places API key | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) → Credentials |
| `GEMINI_API_KEY` | Gemini AI API key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GOOGLE_CREDENTIALS_JSON` | Base64-encoded service account JSON | Google Cloud → IAM → Service Accounts → Keys → JSON → base64 encode |
| `SPREADSHEET_ID` | Google Sheets document ID | From the sheet URL: `docs.google.com/spreadsheets/d/{THIS_PART}/edit` |
| `FURSAT_API_URL` | Fursat.fun API base URL | e.g. `https://fursat.fun` |
| `FURSATPHOTO_API_KEY` | API key for Fursat.fun import | Get from Fursat.fun admin |

### Base64 Encode Service Account

```bash
# Download service account JSON from Google Cloud Console, then:
base64 -i service-account.json | tr -d '\n'
# Paste the output as GOOGLE_CREDENTIALS_JSON
```

## Google Cloud Setup

### Required APIs

Enable these in Google Cloud Console → APIs & Services → Library:

1. **Places API** — for photo extraction, reviews, place search
2. **Sheets API** — for reading/writing the Listings sheet

### Service Account Permissions

The service account needs:
- **Editor** access to the Listings Google Sheet (share the sheet with the service account email)
- No other permissions needed

### API Key Restrictions (Recommended)

For `GOOGLE_MAPS_API_KEY`:
- Application restrictions: HTTP referrers → `fursatphoto.vercel.app/*`
- API restrictions: Places API only

## Google Sheet Requirements

The Listings sheet must have these exact column headers in row 1 (some have trailing spaces):

```
Property Name | Property ID  | State/City | Google Maps Link | Contact Number |
Airbnb Name  | Total Rooms | Bathroom  | Beds | Guests | Pricing Type |
Cost Price  | Selling Price | Extra Guest Price applies after  | Extra Guest Price |
Pet Fee | Airbnb Link | Essentials | Wifi | Hot Water | Pets Allowed |
Any other amenities | Google Rating | Google Reviews | AI Description |
Last Enriched | Cancellation Policy | UPI ID
```

The trailing spaces on some column names (e.g., `"Property ID "`, `"Cost Price "`) are intentional — the code matches them exactly.

## Local Development

```bash
# Install dependencies
npm install

# Copy env vars (same as Vercel, in .env.local)
cp .env.example .env.local  # edit with your values

# Run dev server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### "Could not parse this URL"
The URL must be a full Google Maps place URL from the browser address bar containing `/place/` and `@coordinates`. Shortened links (`maps.app.goo.gl`) cannot be resolved server-side.

### Sheet sync creates duplicate rows
Check that the "Property ID " column (column B) exists in your sheet with that exact name (including trailing space). Dedup matches by this column first.

### Photos not downloading
Verify the Places API is enabled and the API key hasn't exceeded quotas. Google limits to 10 photos per place.

### AI description fails
Check that `GEMINI_API_KEY` is set and valid. The app uses `gemini-2.0-flash-lite` (cheapest model).

### Fursat publish fails with "API unreachable"
Set `FURSAT_API_URL` to the production Fursat.fun URL (not localhost). Also verify `FURSATPHOTO_API_KEY` is correct.
