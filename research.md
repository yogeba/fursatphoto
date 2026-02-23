# Fursat Property Onboarding — Automation Research

## Current Manual Process

```
Step 1:  Choose market from target list
Step 2:  Google search for top stays (resorts, cottages, retreats)
Step 3:  Paste results in AI chatbot
Step 4:  Query each property on Airbnb, Booking.com, Agoda
Step 5:  Flag properties present on OTAs (high probability)
Step 6:  Remaining = target properties. Repeat till market exhausted.
Step 7:  WhatsApp all targets:
         "Hi, inquiry for 21-24 June, 15 guests
          - Entire property, rooms & beds?
          - B2B prices incl breakfast?
          - Attached washrooms with geysers?
          - Wifi, amenities, parking, photos?"
Step 8:  fursatphoto.vercel.app → extract photos + AI description
Step 9:  Fill property details → Publish & Sync (Sheet + Fursat.fun)
Step 10: Create Airbnb listing with generated data
Step 11: Complete listing: internal name, description, pricing
         (extra guest fee = selling price / 2), amenities, house rules,
         Airbnb custom link
```

**Time per market: ~4+ hours. Time per property: ~30-40 min.**

## Automated Pipeline

```
Night:      OpenClaw researches markets (Steps 2-6)
Morning:    Gupshup sends WhatsApp templates to all targets (Step 7)
Day:        Property owners reply with details
Evening:    OpenClaw → fursatphoto APIs (Steps 8-9) → Airbnb (Steps 10-11)
You:        Sleep
```

**Time per property: ~0. Airbnb at human pace: 10-15 min/listing automated.**

## What's Already Built (fursatphoto)

All code lives in one repo: `fursatphoto`. Deployed at `fursatphoto.vercel.app`.

### API Endpoints

| API Endpoint | What it does |
|---|---|
| `POST /api/extract-place` | Google Maps URL → coordinates + name |
| `POST /api/search-place` | Coordinates → Place ID |
| `POST /api/place-details` | Place ID → photos + reviews + rating + **phone number** + website |
| `POST /api/generate-description` | Reviews → AI description + property data (single Gemini call) |
| `POST /api/download-photo` | Photo reference → JPEG (4800px) |
| `POST /api/sync-sheet` | Property details → Google Sheet (dedup by Property ID / name) |
| `POST /api/publish-to-fursat` | Forward to Fursat.fun import API |
| `POST /api/onboard-property` | **Orchestrator** — single call runs all 6 steps above (URL → photos → AI → sheet → Fursat) |
| `POST /api/send-whatsapp` | Send Gupshup WhatsApp template (single or bulk) |
| `POST /api/whatsapp-webhook` | Receive inbound WhatsApp replies from Gupshup |
| `GET /api/whatsapp-webhook` | Debug — view last 20 inbound messages |

### Orchestrator: `POST /api/onboard-property`

Single endpoint that chains Steps 8-9 into one API call. OpenClaw (or any script) calls this instead of 6 separate endpoints.

```json
// Request
{
  "googleMapsUrl": "https://www.google.com/maps/place/...",
  "contactNumber": "+91 98765 43210",
  "totalRooms": 5,
  "costPrice": 3000
}

// Response
{
  "success": true,
  "property": { "name", "placeId", "phoneNumber", "rating", "photoCount", "photoReferences" },
  "description": "AI-generated Airbnb listing...",
  "inferredData": { "wifi": true, "stateCity": "Kasol, HP" },
  "sheet": { "action": "created", "rowNumber": 221 },
  "fursat": { "listingId": "...", "editUrl": "..." },
  "steps": ["Parsed URL", "Found Place ID", "Got 10 photos", "Generated AI description", "Sheet: created at row 221", "Published to Fursat.fun"]
}
```

Features: auto-extracts phone from Google Maps, optional overrides (rooms/pricing from WhatsApp reply), skip flags (`skipDescription`, `skipSheet`, `skipFursat`), auto-calculates selling price at 1.5x cost, `steps` array for debugging.

### WhatsApp: `POST /api/send-whatsapp`

Sends Gupshup WhatsApp template messages. Supports single or bulk send.

```json
// Single
{ "destination": "919876543210", "dates": "21-24 June", "guestCount": "15" }

// Bulk
{ "messages": [
  { "destination": "919876543210", "dates": "21-24 June", "guestCount": "15" },
  { "destination": "919876543211", "dates": "21-24 June", "guestCount": "15" }
]}

// Response
{ "success": true, "sent": 2, "failed": 0, "total": 2, "results": [...] }
```

### WhatsApp Webhook: `POST /api/whatsapp-webhook`

Receives inbound messages from Gupshup. Responds 200 immediately (Gupshup requirement). Logs sender phone, message type (text/image/file), and content. Stores last 100 messages in memory for debugging. `GET /api/whatsapp-webhook` returns recent messages.

**TODO (Phase 4):** Match inbound phone to Targets sheet → auto-trigger onboard-property pipeline.

### OpenClaw Skill & Config

Located in `openclaw/` folder within the repo:

| File | What it does |
|---|---|
| `openclaw/SKILL.md` | Full skill: research markets on Google Maps, OTA check on Airbnb/Booking/Agoda, send WhatsApp, call onboard-property API |
| `openclaw/openclaw.json` | Containment: browser-only, no filesystem/exec, URL allowlist, session-scoped sandbox |

Activate: `ln -s ~/Code/fursatphoto/openclaw ~/.openclaw/skills/fursat-onboard`

### Env Vars

| Variable | Purpose | Status |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Places API | ✅ Set |
| `GEMINI_API_KEY` | AI descriptions | ✅ Set |
| `GOOGLE_CREDENTIALS_JSON` | Sheets API (base64 service account) | ✅ Set |
| `SPREADSHEET_ID` | Google Sheet ID | ✅ Set |
| `FURSAT_API_URL` | Fursat.fun API base | ✅ Set |
| `FURSATPHOTO_API_KEY` | Fursat.fun import key | ✅ Set |
| `GUPSHUP_API_KEY` | Gupshup WhatsApp API | ⏳ Need to add |
| `GUPSHUP_APP_NAME` | Gupshup app name | ⏳ Need to add |
| `GUPSHUP_SOURCE_NUMBER` | Registered WhatsApp number | ⏳ Need to add |
| `GUPSHUP_TEMPLATE_ID` | Approved template ID | ⏳ Template pending approval |

OpenClaw calls these APIs directly. No browser automation needed for Steps 7-9.

## What Needs Building

### 1. Gupshup WhatsApp Integration

**Purpose:** Step 7 — send inquiry template to target properties at scale.

**API:** `POST https://api.gupshup.io/wa/api/v1/template/msg`

**Authentication:** Header `apikey: <32-char-hex>`, Content-Type `application/x-www-form-urlencoded`

**Template to approve:**
```
Hi, we have an inquiry for {{1}} for {{2}} guests.

- Entire property, how many rooms & beds?
- B2B prices including breakfast?
- Attached washrooms with geysers in all rooms?
- Wifi available?
- Amenities available?
- Photos please?
- Parking available?

Thank you,
Team Fursat.fun
```

**Template approval:** Automated ML review takes minutes to a few hours. Human review up to 48 hours. Rules: no adjacent variables, sequential numbering required, sample values mandatory.

**Sending limits:** 20 msgs/sec (Gupshup). Meta tier limits: start at 250 unique contacts/24hr, auto-upgrades to 1K → 10K → 100K → unlimited as volume grows with medium/high quality rating.

**Pricing (India):** Meta utility template ~₹0.13/msg + Gupshup fee ~₹0.08/msg = **~₹0.21/msg total**. Marketing templates cost ~₹0.86/msg — classify the inquiry template as utility (transaction-related) to save 4x.

**Webhook for replies:** Gupshup sends POST to your callback URL. Must respond 200 with empty body within 10 seconds. Inbound payload includes sender phone, message type (text/image/file), and message content.

**Env vars needed:** `GUPSHUP_API_KEY`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`

### 2. OpenClaw Custom Skill

**Location:** `~/.openclaw/skills/fursat-onboard/SKILL.md`

**SKILL.md format:** YAML frontmatter (name, description, metadata with requires/env/bins) followed by markdown instructions. Skills load from `~/.openclaw/skills/` (shared) or `<workspace>/skills/` (per-agent).

```yaml
---
name: fursat-onboard
description: Research markets, identify target properties, onboard via fursatphoto APIs
metadata:
  openclaw:
    requires:
      env:
        - GUPSHUP_API_KEY
        - GUPSHUP_SOURCE_NUMBER
    emoji: "🏠"
---
```

**Skill does:**
1. Browser → Google Maps → search "{keyword} in {market}"
2. Extract property names + Google Maps URLs from results
3. Browser → check each property on Airbnb/Booking/Agoda
4. Classify: on OTA = skip, not on OTA = target
5. Call Gupshup API → send WhatsApp to targets
6. Call fursatphoto APIs → extract photos, generate description, sync sheet
7. Browser → Airbnb host dashboard → create listing at human pace

**Browser automation:** OpenClaw uses Chrome DevTools Protocol. Three modes: managed browser (isolated), extension relay (real profile), remote CDP. Uses AI snapshots with numeric refs — no CSS selectors needed, AI reads the page and interacts by ref numbers.

### 3. OpenClaw Containment Config

```json
{
  "tools": {
    "policy": {
      "deny": ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"]
    },
    "browser": {
      "allowedUrls": [
        "https://www.google.com/maps/*",
        "https://maps.google.com/*",
        "https://www.airbnb.com/*",
        "https://www.booking.com/*",
        "https://www.agoda.com/*",
        "https://fursatphoto.vercel.app/*",
        "https://api.gupshup.io/*"
      ]
    },
    "fs": { "workspaceOnly": true }
  },
  "sandbox": {
    "scope": "session"
  }
}
```

**Docker setup:** Run `docker-setup.sh` → builds image, config wizard, generates gateway token. Each agent session gets a fresh container. Network default is `"none"` (no internet) — override for API calls.

**Security audit:** `openclaw security audit --deep` runs live Gateway probe. Use `loopback` bind mode (default). DM access set to `pairing` or `allowlist`.

**Run in Docker.** No third-party skills. Start with Extension Relay mode for Airbnb (uses your real logged-in Chrome profile).

## Unit Economics

### Cost per property onboarded

| Item | Cost |
|---|---|
| Google Maps API (search + details + 10 photos) | $0.12 |
| Gemini Flash Lite (description) | $0.001 |
| Gupshup WhatsApp (1 template) | $0.01 |
| OpenClaw / Claude API (~15 turns) | $0.15-0.30 |
| **Total** | **~₹35 ($0.40)** |

### Revenue per property (50% markup on bookings)

| Stay type | Cost price | Selling price | Margin/night |
|---|---|---|---|
| Budget | ₹2,000 | ₹3,000 | ₹1,000 |
| Mid-range | ₹5,000 | ₹7,500 | ₹2,500 |
| Premium | ₹10,000 | ₹15,000 | ₹5,000 |

**Break-even: 1 booking per property. Onboarding cost is negligible.**

### Scale projection

| Properties | Onboarding cost | Revenue/month (1 booking, 2 nights avg) |
|---|---|---|
| 50 | ₹1,750 | ₹1L - 5L |
| 200 | ₹7,000 | ₹4L - 20L |
| 500 | ₹17,500 | ₹10L - 50L |

## Risk Assessment

| Step | Method | Risk |
|---|---|---|
| 2-6 Research | OpenClaw browser, public pages | Low — no login, public data |
| 7 WhatsApp | Gupshup Business API | Zero — official approved channel |
| 8-9 fursatphoto | Direct API calls | Zero — our own code |
| 10-11 Airbnb | OpenClaw browser, real Chrome | Medium — mitigated by human pace |

**Airbnb mitigation:**
- Real Chrome profile via EasyClaw (not headless)
- Human-like delays: random 8-20 min between listings
- 3-4 listings/hour max
- Real mouse movements, character-by-character typing
- Use your actual logged-in session

## Airbnb Listing Creation — What OpenClaw Automates

The Airbnb host dashboard listing flow (what the skill does in Steps 10-11):

1. **Property type** — Entire place, select property type (villa/cottage/homestay)
2. **Location** — Enter address, confirm pin on map
3. **Capacity** — Max guests, bedrooms, beds (types), bathrooms
4. **Amenities** — Checklist: WiFi, kitchen, parking, pool, safety items
5. **Photos** — Upload 10+ photos, select cover photo
6. **Title** — Max 50 characters
7. **Description** — 500 characters, generated by our AI
8. **Pricing** — Nightly base price, extra guest fee (= selling price / 2), cleaning fee
9. **Calendar** — Available dates, min/max stay, advance notice
10. **House rules** — Check-in/out times, pets, smoking, parties, cancellation policy
11. **Review & Publish** — Review all, click Publish. New listings get 4-week search boost.

**Airbnb ToS risk:** ToS prohibits "bots, crawlers, scrapers, or other automated means." OpenClaw mitigates by using Extension Relay (real Chrome profile, not headless), human-like delays (8-20 min between listings, 3-4/hour max), Bezier curve mouse movements, randomized keystroke timing (50-150ms), and your actual logged-in session.

**Alternative: Channel Manager route.** Instead of browser automation, use a PMS/channel manager that already has Airbnb API access (Hostaway, Guesty, Channex, Smoobu). You integrate with their API; they push to Airbnb. Fully ToS-compliant. Worth evaluating if scale exceeds 50 properties.

## Implementation Order

1. **Gupshup into fursatphoto** — add `POST /api/send-whatsapp` endpoint + webhook
2. **OpenClaw install** — Docker, locked down, custom skill only
3. **Test on 1 market** — overnight research, review results manually
4. **If good** — enable WhatsApp outreach for that market
5. **If replies come** — run fursatphoto pipeline, create Airbnb listings
6. **If all works** — scale to multiple markets per night

---

## Detailed TODO List

### Phase 1: Gupshup WhatsApp Integration (fursatphoto)

> Goal: Send WhatsApp inquiry templates and receive replies via webhook.

- [ ] **1.1** Sign up for Gupshup WhatsApp Business API account
- [ ] **1.2** Register/verify WhatsApp Business number on Gupshup dashboard
- [ ] **1.3** Create WhatsApp template message in Gupshup console
  - Category: Utility (not Marketing — saves 4x on cost)
  - Body with `{{1}}` (dates) and `{{2}}` (guest count) variables
  - Add sample values for template review
  - Wait for approval (minutes to 48 hours)
- [ ] **1.4** Get API credentials from Gupshup dashboard
  - API key (32-char hex)
  - App name
  - Source number (registered WhatsApp number)
- [ ] **1.5** Add env vars to fursatphoto `.env.local` and Vercel
  - `GUPSHUP_API_KEY`
  - `GUPSHUP_APP_NAME`
  - `GUPSHUP_SOURCE_NUMBER`
  - `GUPSHUP_TEMPLATE_ID`
- [x] **1.6** Build `POST /api/send-whatsapp` endpoint — ✅ Done
  - Single + bulk send, phone number cleaning, sequential sending
- [x] **1.7** Build `POST /api/whatsapp-webhook` endpoint — ✅ Done
  - Immediate 200 response, logs inbound messages, GET for debugging
  - TODO Phase 4: match phone to Targets → trigger onboard pipeline
- [ ] **1.8** Configure webhook URL in Gupshup console
  - Point to `https://fursatphoto.vercel.app/api/whatsapp-webhook`
  - Subscribe to message events and message status events (sent/delivered/read/failed)
- [ ] **1.9** Test end-to-end: send template to your own number → reply → verify webhook receives it
- [ ] **1.10** Add bulk send UI to fursatphoto (optional)
  - CSV upload or paste phone numbers
  - Set dates and guest count
  - Send all with progress indicator

### Phase 2: OpenClaw Setup & Market Research Skill

> Goal: OpenClaw researches markets overnight (Steps 2-6) and outputs a list of target properties with Google Maps URLs.

- [ ] **2.1** Install OpenClaw via Docker
  - Run `docker-setup.sh`
  - Complete configuration wizard
  - Generate gateway token
  - Verify gateway starts and is accessible on loopback
- [x] **2.2** Configure containment in `openclaw.json` — ✅ Done (`openclaw/openclaw.json`)
  - Deny: `group:automation`, `group:runtime`, `group:fs`, `sessions_spawn`, `sessions_send`
  - Browser URLs: Google Maps, Airbnb (.com + .co.in), Booking.com, Agoda, fursatphoto
  - `sandbox.scope: "session"`, `fs.workspaceOnly: true`, `gateway.auth.mode: "token"`
- [ ] **2.3** Run `openclaw security audit --deep` to verify lockdown
- [ ] **2.4** Set up OpenClaw API keys
  - Claude API key (or alternative LLM)
  - Estimate: ~$0.15-0.30/property at ~15 turns per property
- [x] **2.5** Create skill folder — ✅ Done (`openclaw/` in repo, symlink to `~/.openclaw/skills/fursat-onboard`)
- [x] **2.6** Write `SKILL.md` — ✅ Done (full 5-step workflow: research → OTA check → WhatsApp → onboard → report)
  - YAML frontmatter: name, description, required env vars
  - Instructions for Steps 2-6:
    1. Accept market name and keywords as input
    2. Browser → Google Maps → search "{keyword} in {market}" (e.g., "resorts in Kasol")
    3. Extract property names + Google Maps URLs from search results
    4. For each property: browser → Airbnb search "{property name} {market}"
    5. Check if property appears on Airbnb (name match in results)
    6. Repeat for Booking.com and Agoda
    7. Classify: found on any OTA = skip, not found = target
    8. Output: JSON list of targets with name, Maps URL, phone (if found), OTA status
- [ ] **2.7** Test skill on 1 market manually
  - Run: "Research resorts in Kasol"
  - Review output: are targets correct? Are OTA checks accurate?
  - Iterate on skill instructions until quality is good
- [ ] **2.8** Add phone number extraction to skill
  - Google Maps shows phone numbers for many businesses
  - Extract from place details or Maps sidebar
  - This is critical — without phone numbers, can't send WhatsApp

### Phase 3: Connect Research → WhatsApp Outreach

> Goal: Automatically send WhatsApp inquiries to all target properties identified by OpenClaw.

- [ ] **3.1** Extend `SKILL.md` with WhatsApp sending step
  - After research outputs target list with phone numbers
  - Call `POST https://fursatphoto.vercel.app/api/send-whatsapp` for each target
  - Pass dates and guest count (configurable per run)
  - Log sent/failed messages
- [ ] **3.2** Add "Targets" tab to Google Sheet
  - Columns: Market, Property Name, Google Maps URL, Phone, OTA Status, WhatsApp Sent, WhatsApp Reply, Date
  - Build `POST /api/sync-targets` endpoint in fursatphoto to write research results
- [ ] **3.3** Test full flow: OpenClaw research → auto WhatsApp to targets
  - Run on 1 market overnight
  - Morning: check Sheet for targets list, check WhatsApp for sent messages
  - Wait for replies throughout the day
- [ ] **3.4** Monitor WhatsApp quality rating
  - Check Gupshup dashboard for delivery rates
  - Check Meta Business Manager for quality rating
  - If quality drops to "Low", pause and investigate (template wording, targeting)

### Phase 4: Automated Property Onboarding (Steps 8-9)

> Goal: When a property owner replies with details, automatically run the fursatphoto pipeline.

- [ ] **4.1** Enhance webhook to trigger onboarding pipeline
  - When a reply comes in from a known target (match by phone number in Targets sheet):
    1. Look up the property's Google Maps URL from the Targets sheet
    2. Call `POST /api/extract-place` with the Maps URL
    3. Call `POST /api/search-place` with coordinates
    4. Call `POST /api/place-details` with Place ID
    5. Call `POST /api/generate-description` with reviews
    6. Call `POST /api/sync-sheet` with all data
    7. Call `POST /api/publish-to-fursat` with listing data
  - OR: extend the OpenClaw skill to call these APIs when triggered
- [ ] **4.2** Parse WhatsApp replies for property details
  - Extract room count, pricing, bed count from reply text (Gemini or regex)
  - Save photos sent via WhatsApp (image attachments)
  - Merge parsed data with Google Maps data before sheet sync
- [x] **4.3** Build `POST /api/onboard-property` orchestrator endpoint — ✅ Done
  - Chains all 6 steps: extract → search → details → AI description → sheet → Fursat
  - Accepts overrides (rooms, pricing from WhatsApp), skip flags, auto-extracts phone
  - Returns property data, description, sheet result, Fursat result, steps log
- [ ] **4.4** Test: simulate a WhatsApp reply → verify property appears in Sheet + Fursat.fun

### Phase 5: Airbnb Listing Automation (Steps 10-11)

> Goal: OpenClaw creates Airbnb listings using browser automation at human pace.

- [ ] **5.1** Set up OpenClaw Extension Relay for Airbnb
  - Install OpenClaw Chrome extension
  - Log into Airbnb host dashboard in your regular Chrome
  - Attach extension to Airbnb tab
  - This uses your real profile — no headless detection risk
- [ ] **5.2** Write `SKILL.md` — Phase B: Airbnb Listing Creation
  - Instructions for Steps 10-11:
    1. Read property data from Google Sheet (via fursatphoto API or direct)
    2. Navigate to Airbnb host dashboard → "Create a new listing"
    3. Step through the wizard:
       - Property type: Entire place → Villa/Cottage/Homestay (from Sheet)
       - Location: enter from Google Maps data
       - Capacity: guests, bedrooms, beds, bathrooms (from Sheet)
       - Amenities: check boxes matching Sheet data (WiFi, Hot Water, etc.)
       - Photos: upload from downloaded photos (need local file access for this)
       - Title: Airbnb Name from Sheet (max 50 chars)
       - Description: AI description from Sheet
       - Pricing: Selling Price as nightly rate, Extra Guest Fee = Selling Price / 2
       - Calendar: set available dates
       - House rules: check-in 2pm, checkout 11am (defaults)
       - Cancellation: Flexible or Moderate
    4. Review and Publish
    5. After publish: set Internal Name = real Property Name
    6. Set "Approve all bookings" in Booking Settings
    7. Create Airbnb custom link
  - Human-like behavior rules in the skill:
    - Random 8-20 min delay between listings
    - Max 3-4 listings per hour
    - Randomized typing speed (50-150ms per keystroke)
    - Bezier curve mouse movements
    - Occasional pauses (simulate reading/thinking)
- [ ] **5.3** Solve photo upload challenge
  - OpenClaw browser can upload files via `file` input elements
  - Need to download photos locally first (via `/api/download-photo`)
  - Or: use OpenClaw's `web_fetch` to download, then browser file upload
  - Test: can OpenClaw upload a file to Airbnb's photo uploader?
- [ ] **5.4** Test on 1 property: watch OpenClaw create an Airbnb listing
  - Supervise the first few runs (Extension Relay gives you visibility)
  - Verify all fields filled correctly
  - Check listing looks good after publish
- [ ] **5.5** Handle edge cases
  - Airbnb CAPTCHA / Turnstile challenge → pause, alert user
  - Session expiry → re-login prompt
  - Photo upload failure → retry with exponential backoff
  - Missing data → skip field, flag for manual review

### Phase 6: Scale & Monitor

> Goal: Run multiple markets per night, track conversion, optimize.

- [ ] **6.1** Build market queue system
  - List of markets to research (e.g., Kasol, Manali, Shimla, Rishikesh, etc.)
  - OpenClaw picks next market from queue each night
  - Track: researched, targets found, WhatsApp sent, replies, onboarded, listed
- [ ] **6.2** Add monitoring dashboard to fursatphoto
  - Markets researched (count + list)
  - Properties found / targets / contacted / replied / onboarded / listed
  - WhatsApp delivery/read rates
  - Costs (API calls, WhatsApp messages)
- [ ] **6.3** Evaluate channel manager route for Airbnb
  - If scale > 50 properties, evaluate Hostaway/Guesty/Channex
  - These have official Airbnb API access → no browser automation needed
  - Trade-off: monthly subscription cost vs. ToS risk of browser automation
- [ ] **6.4** Optimize costs
  - Monitor Claude API spend per property (target: < $0.30)
  - Consider switching to cheaper LLM for research steps (DeepSeek, GPT-4o-mini)
  - Keep Gemini Flash Lite for descriptions (already cheapest at $0.001)
  - Batch WhatsApp sends during off-peak hours
- [ ] **6.5** Quality control
  - Weekly review of AI-generated descriptions (spot check 10%)
  - Review Airbnb listings for accuracy (photos match property, pricing correct)
  - Monitor Airbnb account health (no warnings, no listing takedowns)
  - Monitor Gupshup quality rating (stay Medium or High)

## Notes

- Photos should not show property name
- Do not mention exact location in AI description
- All listings need minimum 10 photos (Google provides max 10 per place)
- Extra guest fee on Airbnb = always half of selling price
- After Airbnb publish: add real property name as Internal Name
- Set "Approve all bookings" in Booking Settings
- Airbnb Software Partner API is not viable (long approval, selective, not accepting new partners)
- Template message category matters: Utility = ₹0.21/msg, Marketing = ₹0.94/msg — 4x difference
- Meta messaging tier starts at 250 unique contacts/24hr — will auto-upgrade as volume grows
- OpenClaw uses ~$0.15-0.30 per property in Claude API costs at ~15 turns
- Channel manager (Hostaway/Guesty) is the ToS-safe Airbnb route if scale warrants the subscription cost

---

# Fursat Scaling Strategy & Partnership Plan

## Business Vision

Build India's largest property distribution platform. Not a property manager — a **distribution infrastructure company** that connects offline properties to every booking channel, fully automated.

### 4-Phase Growth Plan

```
Phase 1: List properties on Airbnb + fursat.fun
         → Book properties, gain trust, prove the model
         → Target: 1,000 properties

Phase 2: Target top-rated properties with 0-1 online presence
         → Sign channel management contracts
         → "We put you on 7+ OTAs. You do nothing."
         → Target: 500 channel-managed properties

Phase 3: Content flywheel
         → Fursat.fun creators book Phase 2 properties for free
         → In exchange: professional content (reels, photos, reviews)
         → Content drives direct bookings on fursat.fun (zero OTA commission)

Phase 4: Own properties
         → Leverage government tourism schemes
         → Build/acquire Le Native-style properties in top 50 markets
         → Capital pooled from content revenue + operations profit
```

Each phase compounds on the previous one. Phase 1 builds supply. Phase 2 builds margin. Phase 3 builds demand. Phase 4 builds assets.

---

## Current State (Feb 2026)

| Metric | Value |
|--------|-------|
| Properties listed | 145 (Airbnb only) |
| Total bookings | 66 |
| Total revenue | ₹22.3L |
| Total profit | ₹8.3L |
| Avg profit/booking | ₹12,600 |
| Good review rate | 71% (47/66) |
| Channels | Airbnb only |
| Booking frequency | ~0.45 bookings/property (low — single channel) |

### What's Already Built

| System | What it does | Status |
|--------|-------------|--------|
| **FursatAgent** | AI guest communication, inquiry handling, Telegram notifications | Production |
| **fursatphoto** | Property onboarding pipeline (photos, AI descriptions, sheet sync) | Production |
| **OpenClaw skill** | Overnight market research, OTA checks, WhatsApp outreach | Built, not tested |
| **Gupshup integration** | WhatsApp template sending + webhook for replies | Built, pending API keys |
| **Google Sheets** | Listings DB (145 properties), Booking tracker, Enquiry Capture | Production |

---

## Why 10,000? Why Not 100,000?

### The tech scales infinitely

| Component | Marginal cost at 100K properties |
|-----------|--------------------------------|
| Property onboarding (fursatphoto) | ₹35/property (API calls) |
| Channel distribution (Channex) | $0.50/property/month |
| Guest communication (FursatAgent) | ~$0/inquiry (OpenAI at scale) |
| Owner outreach (Gupshup) | ₹0.21/message |

No component has a hard scaling wall. Onboarding is automated. Distribution is API-driven. Guest comms are AI-handled.

### The only real bottlenecks

| Bottleneck | At what scale | Solution |
|-----------|--------------|---------|
| **Payment operations** | 1,000+ properties (30K txns/month) | Cashfree/Stripe split payments — automated, already have accounts |
| **Owner acquisition velocity** | Ongoing | OpenClaw + Gupshup pipeline: 100 properties contacted/night, 5-10% conversion = 150-300 new/month |
| **Guest support escalations** | 5,000+ properties | Tiered support team: ₹15-20K/person/month, 50 tickets/day each. 4 people covers 10K properties. Cost is noise vs revenue. |
| **Quality control** | 10,000+ properties | Guest reviews as automated QC. Drop properties below 4 stars. Phase 3 creator visits = physical QC. |
| **Legal/regulatory** | 10,000+ properties | LLP registration, GST, standard channel management contract (one-time ₹50K legal cost) |

**Supply is not a constraint.** India has ~200,000 hotels and ~500,000 homestays/guesthouses. Most are NOT on OTAs.

---

## Multi-Channel Distribution: Channex

### Why Channex (not RateTiger, not Beds24)

RateTiger charges per-room per-month — unsustainable at scale. Beds24 is cheaper but has harsh API rate limits (60 calls/5 min) that break at 10K+ properties.

Channex White Label API plan: **$0.50/property/month** (vacation rental classification) + $130/month base.

| Scale | Channex/month | Beds24/month | RateTiger/month |
|-------|--------------|-------------|----------------|
| 1,000 | **$630** (₹53K) | $4,600 | $15,000+ |
| 10,000 | **$5,130** (₹4.3L) | $46,000 | $150,000+ |
| 100,000 | **$50,130** (₹42L) | $460,000 | Doesn't scale |

### Channex capabilities

- **REST API** — programmatic property creation, rate/availability management, bulk updates
- **50+ OTAs** including Airbnb, Booking.com, Agoda, Expedia
- **MakeMyTrip + Goibibo** — confirmed supported (dedicated mapping guide in docs)
- **White-label** — embed under Fursat brand, owners see our platform
- **No API rate limit nightmare** — built for PMS integrations at scale
- **Full docs**: https://docs.channex.io

### Revenue impact of multi-channel

| Scenario | Properties | Bookings/property/mo | Monthly Profit |
|----------|-----------|---------------------|----------------|
| Now (Airbnb only) | 145 | ~0.5 | ~₹1.2L |
| +Channex (same 145) | 145 | 2-3 | ₹3.6-5.4L |
| Scale to 500 | 500 | 2-3 | ₹12.6-18.9L |
| Scale to 1,000 | 1,000 | 2-3 | ₹25-37L |
| Scale to 10,000 | 10,000 | 2-3 | ₹2-3Cr |

Multi-channel doesn't just add channels — it multiplies bookings per property by 4-6x.

### Channex integration plan

1. Sign up for White Label API plan ($130/month + $0.50/property)
2. Build `POST /api/channex-sync` endpoint in fursatphoto — creates Channex property from Sheet data
3. Map each property to OTA channels via Channex API
4. FursatAgent receives bookings from all channels (Channex webhook → FursatAgent)
5. Rates/availability sync: Sheet → Channex → all OTAs

---

## Partnership

### Partners

- **Yogesh** — Built all tech (FursatAgent, fursatphoto, automation pipeline), 145 existing properties, Airbnb account history, brand, fursat.fun platform
- **Partner** — ₹10L capital investment, 6K Instagram account, proven work ethic, full-time operations

### Capital Deployment (₹10L)

| Bucket | Amount | What It Unlocks |
|--------|--------|----------------|
| Working capital (owner advances) | ₹4-5L | Accept every booking including ₹1L+ stays. Self-replenishing — returns after each booking. |
| Channex Year 1 | ₹50K-1L | Multi-OTA distribution for all properties from day one |
| Content creation | ₹1-1.5L | Instagram growth + creator property visits (Phase 3 seed) |
| Gupshup WhatsApp | ₹50K | ~2,000+ properties contacted |
| Legal (LLP + contract template) | ₹50K-1L | Standard channel management agreement, GST registration |
| Buffer | ₹1-1.5L | Travel for Phase 2 contracts, emergencies, tools |

The ₹10L is ignition capital. Once payments are automated and bookings flow, the business self-funds.

### Structure

| Term | Detail |
|------|--------|
| **Entity** | LLP (cheapest, flexible, ₹5-8K to register) |
| **Profit split** | 60-40 (Yogesh-Partner) Year 1 → 50-50 Year 2+ on milestone |
| **Capital return** | Partner's ₹10L is priority return — first ₹10L profit goes back before any split |
| **Milestone for 50-50** | Any 2 of: 200 new properties, ₹20L cumulative profit (post capital return), 50 channel management contracts, Instagram 25K+ followers |
| **Review** | 6-month checkpoint. Either party can exit with 60 days notice. |

### Role Split

| Area | Yogesh | Partner |
|------|--------|---------|
| Tech + automation | Build and maintain pipeline | Requirements, testing |
| Property onboarding | Automated pipeline | QA, owner relationships, Phase 2 contracts |
| Guest inquiries | FursatAgent handles 80%+ | Escalations, reviews |
| Content + marketing | fursat.fun platform | Instagram, creator partnerships, reels |
| Finance | Pricing strategy, margins | Owner advances, collections, payments |
| New markets | Identify via data/automation | Visit, establish on ground |

### Non-Negotiables

1. **Tech IP** (FursatAgent, fursatphoto, automation) stays with Yogesh regardless of partnership outcome
2. **Airbnb accounts** stay in Yogesh's name. Operational access for Partner, ownership stays.
3. **Capital is priority return, not equity purchase** — ₹10L comes back before profit split, doesn't buy a fixed %
4. **No competing business** for either party while partnership is active
5. **Exit clause** — 60 days notice, remaining working capital returned pro-rata, ongoing bookings completed per agreement

---

## Projected Growth — 100K Properties in 2026

### The math to 100K

To hit 100,000 properties by Dec 2026 (~10 months from now):
- Need ~10,000 properties/month average
- Or ~330 properties/day
- At 5% WhatsApp conversion: need to contact ~6,600 owners/day
- Gupshup supports 20 msgs/sec = 72,000/hour — not a limit
- Meta tier limit starts at 250/day but auto-upgrades: 250 → 1K → 10K → 100K → unlimited
- **Key**: Meta tier upgrade takes weeks of consistent volume with good quality rating
- Realistic ramp: slow start (months 1-3), exponential middle (months 4-7), cruise (months 8-10)

### Month-by-month target

| Month | New/month | Cumulative | Channels | Monthly Profit | Milestone |
|-------|----------|-----------|----------|----------------|-----------|
| **Mar 2026** | 100 | 250 | Airbnb + Channex pilot | ₹2-3L | Channex live, Gupshup live |
| **Apr** | 300 | 550 | + Booking.com + Goibibo | ₹5-8L | Partner capital returned |
| **May** | 1,000 | 1,500 | + MakeMyTrip + Agoda | ₹15-25L | Meta tier at 10K/day |
| **Jun** | 3,000 | 4,500 | All 7+ OTAs | ₹40-60L | Phase 2 contracts starting |
| **Jul** | 5,000 | 9,500 | All OTAs | ₹80L-1.2Cr | Hire 2 support people |
| **Aug** | 10,000 | 19,500 | All OTAs + fursat.fun | ₹1.5-2.5Cr | Content flywheel spinning |
| **Sep** | 15,000 | 34,500 | Full distribution | ₹3-5Cr | Multiple Airbnb accounts |
| **Oct** | 20,000 | 54,500 | Full distribution | ₹5-8Cr | Regional ops managers |
| **Nov** | 22,000 | 76,500 | Full distribution | ₹8-12Cr | Phase 4 begins |
| **Dec** | 23,500 | 100,000 | Full distribution | ₹10-15Cr | Target hit |

### What makes this possible

1. **India has 500,000+ unlistened properties** — supply is not a constraint
2. **Onboarding is automated** — ₹35/property, no human needed
3. **Distribution is API-driven** — Channex pushes to all OTAs instantly
4. **Guest comms are AI** — FursatAgent scales to any volume
5. **Owner outreach is automated** — OpenClaw discovers, Gupshup contacts
6. **The only human work**: sign channel management contracts (Phase 2), handle support escalations, monitor quality

### What could break this

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Meta WhatsApp quality rating drops | Outreach velocity capped | Multiple WhatsApp numbers, careful template wording, target quality |
| Airbnb account suspension | Lose listings on one channel | Multiple Airbnb accounts, Channex as backup distribution |
| Low owner conversion rate (<2%) | Need 5x more outreach volume | Improve pitch, follow-up sequences, regional WhatsApp numbers |
| Channex API limitations at 50K+ | Distribution bottleneck | Enterprise deal with Channex, or add Beds24/AxisRooms as secondary |
| Cash flow crunch on large bookings | Can't accept high-value stays | Cashfree auto-split (guest pays → auto-split → owner gets share) |
| Quality drops at scale | Bad reviews, delistings | Automated review monitoring, drop <4 star properties, creator QC visits |

---

## Full Automated Pipeline (End State)

```
NIGHT
  OpenClaw researches 3-5 markets on Google Maps
  Identifies 50-100 target properties (no OTA presence)
  Extracts phone numbers from Google Maps

DAWN
  Gupshup sends WhatsApp inquiry templates to all targets
  Cost: ₹0.21/message × 100 = ₹21

DAY
  Property owners reply with details, photos, pricing
  Webhook receives replies → matches to targets
  fursatphoto pipeline: photos + AI description + Sheet sync
  Channex API: creates property on 7+ OTAs simultaneously

EVENING
  New properties are LIVE on Airbnb, Booking.com, Goibibo,
  MakeMyTrip, Agoda, Expedia, Google Hotels

ONGOING
  FursatAgent handles all guest inquiries (AI-powered)
  Channex syncs availability/rates across all OTAs
  Cashfree/Stripe handles payments automatically
  You: review metrics, handle escalations, sign Phase 2 contracts

VELOCITY: 5-10 new properties/day, 150-300/month
COST: ~₹35/property onboarding + ₹42/property/month distribution
```

---

## Infrastructure Stack

| Layer | Tool | Cost | Purpose |
|-------|------|------|---------|
| **Distribution** | Channex (White Label API) | $0.50/property/mo | Push to 7+ OTAs simultaneously |
| **Guest Comms** | FursatAgent (GPT-4o) | $5/day budget | AI inquiry handling, follow-ups |
| **Onboarding** | fursatphoto | ₹35/property | Photos, AI descriptions, sheet sync |
| **Discovery** | OpenClaw | $0.15-0.30/property | Overnight market research |
| **Outreach** | Gupshup WhatsApp | ₹0.21/message | Owner acquisition at scale |
| **Payments** | Cashfree / Stripe | 2% transaction fee | Automated split payments when needed |
| **Database** | Supabase + Redis | Free tier → scale | Conversations, caching, dedup |
| **Notifications** | Telegram Bot | Free | Operator alerts, action buttons |
| **Content** | Instagram + fursat.fun | ₹1L seed budget | Demand generation, direct bookings |

### Total monthly cost at scale

| Scale | Channex | OpenAI | WhatsApp | Total Fixed | % of Revenue |
|-------|---------|--------|----------|-------------|-------------|
| 1,000 | ₹53K | ₹12K | ₹5K | ~₹70K | ~3% |
| 10,000 | ₹4.3L | ₹12K | ₹15K | ~₹4.6L | ~2% |
| 100,000 | ₹42L | ₹12K | ₹50K | ~₹43L | ~1.5% |

Cost as % of revenue DECREASES with scale. This is a software business.

---

## Immediate Next Steps

1. **Channex integration** — sign up, test API with 5 pilot properties, validate multi-OTA sync
2. **Gupshup activation** — get API keys, approve template, test end-to-end WhatsApp flow
3. **LLP registration** — formalize partnership, open business bank account
4. **First market test** — run full pipeline on 1 market: discover → WhatsApp → onboard → multi-OTA
5. **Measure** — bookings/property before vs after multi-channel, owner conversion rate from WhatsApp outreach
