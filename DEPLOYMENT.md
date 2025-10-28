# Deployment Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Maps API Key
# Get your API key from: https://console.cloud.google.com/google/maps-apis
GOOGLE_MAPS_API_KEY=your_api_key_here

# For client-side photo display (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables:**
   - In Vercel dashboard, go to your project
   - Go to Settings > Environment Variables
   - Add the following variables:
     - `GOOGLE_MAPS_API_KEY` = your Google Maps API key
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your Google Maps API key

4. **Deploy:**
   - Click "Deploy"
   - Your app will be available at `https://your-project-name.vercel.app`

## Google Maps API Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable APIs:**
   - Go to "APIs & Services" > "Library"
   - Enable the following APIs:
     - Places API
     - Maps JavaScript API

3. **Create API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

4. **Restrict API Key (Recommended):**
   - Click on your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `https://your-project-name.vercel.app/*`)
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" and "Maps JavaScript API"

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local` and add your API key

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Build Errors
- Make sure all environment variables are set
- Check that your Google Maps API key is valid
- Ensure the Places API is enabled in Google Cloud Console

### Runtime Errors
- Check browser console for client-side errors
- Check Vercel function logs for server-side errors
- Verify API key restrictions allow your domain

### Photo Download Issues
- Ensure the Places API has photo access enabled
- Check that the place has photos available
- Verify API quotas haven't been exceeded
