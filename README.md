# Fursat Photo

Internal tool for the Fursat.fun property onboarding pipeline. Extracts photos and reviews from Google Maps, generates AI Airbnb descriptions, syncs property data to the Listings Google Sheet, and publishes draft listings to Fursat.fun.

**Live:** [fursatphoto.vercel.app](https://fursatphoto.vercel.app)

## What It Does

1. Paste a Google Maps URL for any stay/property
2. Extracts up to 10 HD photos (4800px) + all reviews
3. Generates an SEO-optimized Airbnb listing description via Gemini AI
4. Extracts property data from reviews (wifi, amenities, location) — only what's explicitly mentioned, no hallucination
5. Shows a property details form pre-filled with available data
6. One click: syncs to Listings Google Sheet + publishes draft on Fursat.fun

## How It Fits the Workflow

```
Step 1-6:  Market research + identify target properties (manual/OpenClaw)
Step 7:    WhatsApp properties for rooms, pricing, photos (manual)
Step 8:    → fursatphoto.vercel.app ← THIS TOOL
Step 9:    Fill in details from WhatsApp → Publish & Sync
Step 10:   List on Airbnb with the generated description + photos
Step 11:   Complete Airbnb listing details (internal name, pricing, amenities)
```

## Setup

### Prerequisites
- Node.js 18+
- Google Cloud project with Places API enabled
- Google service account with Sheets API access
- Gemini API key

### Environment Variables

Create `.env.local`:

```env
# Google Maps Places API (for photos, reviews, place search)
GOOGLE_MAPS_API_KEY=your_key

# Gemini AI (for description generation — uses gemini-2.0-flash-lite)
GEMINI_API_KEY=your_key

# Google Sheets (base64-encoded service account JSON)
GOOGLE_CREDENTIALS_JSON=base64_encoded_service_account_json
SPREADSHEET_ID=your_spreadsheet_id

# Fursat.fun API (for publishing draft listings)
FURSAT_API_URL=https://fursat.fun
FURSATPHOTO_API_KEY=your_api_key
```

### Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                          # Main single-page app
│   └── api/
│       ├── extract-place/route.ts        # Parse Google Maps URL → coords + name
│       ├── search-place/route.ts         # Coords → Place ID via nearby search
│       ├── place-details/route.ts        # Place ID → photos + reviews + rating
│       ├── generate-description/route.ts # Reviews → AI description + property data
│       ├── download-photo/route.ts       # Photo reference → JPEG (400px preview / 4800px full)
│       ├── sync-sheet/route.ts           # Property details → Google Sheets (create/update/dedup)
│       └── publish-to-fursat/route.ts    # Forward to Fursat.fun import API
├── components/
│   ├── URLInput.tsx                      # URL input with help toggle
│   ├── PhotoGallery.tsx                  # Photo grid with select/deselect + download
│   └── PropertyDetailsForm.tsx           # Editable property form + publish button
├── lib/
│   ├── maps-utils.ts                     # URL parsing (extractLatLng, extractPlaceName)
│   └── google-sheets.ts                  # Sheets auth, find/append/update rows
└── types/
    ├── maps.ts                           # AppState, PlacePhoto, PlaceReview, etc.
    └── property.ts                       # PropertyDetails, SHEET_COLUMN_MAP, PRICING_TYPES
```

## API Flow

```
User pastes URL
    │
    ▼
POST /api/extract-place      →  { coordinates, placeName }
    │
    ▼
POST /api/search-place        →  { placeId, placeName }
    │
    ▼
POST /api/place-details       →  { photos[], reviews[], rating }
    │
    ▼
POST /api/generate-description →  { description, inferredData }
    │                               (single Gemini call, no hallucination)
    ▼
User fills form, clicks Publish & Sync
    │
    ├──→ POST /api/sync-sheet         →  { action: created/already_exists }
    └──→ POST /api/publish-to-fursat  →  { listingId, editUrl }
```

## Google Sheet Integration

### Column Mapping

The `SHEET_COLUMN_MAP` in `src/types/property.ts` maps TypeScript field names to exact Google Sheet column headers. Some headers have trailing spaces — this is intentional and matches the real sheet.

### Dedup Logic

`findPropertyRow` in `google-sheets.ts` checks for duplicates:
1. First: match by **Property ID** (Google Place ID) — most reliable
2. Fallback: match by **Property Name** (case-insensitive)

If found with `mode: "create"` → returns `already_exists` (no duplicate created).

### Zero Handling

Unfilled numeric fields (rooms=0, price=0) are written as empty strings to the sheet, not "0". This avoids false data — blank means "not yet entered", 0 would mean "zero rooms".

## AI Description Generation

Single Gemini 2.0 Flash Lite call that:
1. Generates a full Airbnb listing description from reviews
2. Extracts structured property data (appended after `---PROPERTY_DATA---` separator)

The extraction is strict:
- Returns `null` for anything not explicitly mentioned in reviews
- Never guesses room counts, pricing, bed counts — these come from WhatsApp (Step 7)
- Only extracts wifi/hotWater/pets if guests explicitly mention them
- Extracts location and amenities only from guest descriptions

## Key Design Decisions

- **No password gate** — internal tool, no auth needed
- **Single screen** — no step wizard, URL input always visible, results appear below
- **Form waits for AI** — property form doesn't show until description generation completes
- **All fields optional** — only Property Name is required for sheet sync
- **Auto-pricing** — entering cost price auto-fills selling price at +50%
- **Re-publishable** — button stays active after publish for corrections

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- Google Places API
- Google Gemini 2.0 Flash Lite
- Google Sheets API (googleapis)
- JSZip (photo download as ZIP)

## Deployment

Deployed on Vercel. Push to `main` triggers auto-deploy.

All env vars must be set in Vercel dashboard → Settings → Environment Variables.
