# Fursat Photo - Google Maps Photo Extractor

A beautiful Next.js application that extracts and downloads photos from Google Maps places with an Apple-inspired design.

## Features

- 🗺️ Extract photos from any Google Maps place URL
- 📱 Apple-like design with smooth animations
- 📥 Download individual photos or all as a ZIP file
- 🔒 Secure API key handling
- 📱 Responsive design for all devices
- ⚡ Fast and efficient photo processing

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GOOGLE_MAPS_API_KEY=your_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Places API
     - Maps JavaScript API
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Copy a Google Maps place URL (e.g., from a restaurant, hotel, or any business)
2. Paste it into the input field
3. Click "Extract Photos"
4. View the photos in the gallery
5. Download individual photos or all photos as a ZIP file

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## API Endpoints

- `POST /api/extract-place` - Extract coordinates and place name from URL
- `POST /api/search-place` - Find place ID using coordinates
- `POST /api/place-details` - Get place details and photo references
- `POST /api/download-photo` - Download individual photo

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **File Handling:** JSZip
- **API:** Google Places API

## Security

- API keys are stored securely in environment variables
- Server-side API calls protect your API key
- No sensitive data is exposed to the client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details