import { NextRequest, NextResponse } from "next/server";
import { PlaceReview } from "@/types/maps";

const AIRBNB_PROMPT = `Create an SEO optimised and Airbnb best practices, listing title and description based on the sample structure with the information from reviews. Please do not use the stay name in the name or description.

Here is the sample format to follow:

"The Ultimate Offbeat Escape for Soulful Travelers, Nature Enthusiasts & Culture Seekers

Welcome to a hidden gem tucked away in the hills of North Bengal—a rare stay that doesn't just host you, but embraces you like family. Far from the tourist crowds, this serene eco-camp offers a soulful retreat into local life, lush green landscapes, and warm-hearted hospitality.

Perfect for solo wanderers, nature lovers, hiking couples, or small groups seeking an authentic, grounding experience.

⸻

The Space
Rated 4.9/⭐️⭐️⭐️⭐️⭐️ from 18 Google reviews, here's what guests say about this soulful stay:

"It's a must-visit for a unique experience in the hills… The first time I had home-cooked food in the local style. Don't expect luxury, but expect love, attention, warmth, and nature in abundance. The soothing sound of the stream, the chirping birds, and delicious traditional food make it unforgettable."

"A beautiful off-grid experience in a stunning natural setting. What truly sets this place apart is the warmth of the Lepcha family. They go above and beyond to make you feel at home. This is real eco-tourism—genuine, immersive, and impactful."

"Nestled amidst an abandoned tea estate, the cozy cottage exceeded all expectations. Umesh da's hospitality and his addictive tea made our stay feel like home. The village walk and river hike were highlights. We'll definitely return."

"A culturally immersive experience like no other. From the guided walks to heartfelt meals, every moment felt authentic. I felt safe, seen, and surrounded by kindness. The connection I made with the host family and their daughter—even without a shared language—was deeply moving."

⸻

🏡 Guest Access Includes:
        •        Traditional Cottages 🛖 – Aesthetic, functional, cozy. Attached bathrooms with geysers, clean linen, heaters, and wide windows opening to greenery.
        •        Homemade Meals 🫕 – Cooked by the host family using fresh, local ingredients. The tea alone is reason enough to visit.
        •        Nature Walks & Village Hikes 🚶‍♂️🌿 – Explore offbeat trails with your host as your cheerful guide.
        •        Local Community Immersion 🧑‍🌾 – Meet villagers, join cultural exchanges, and enjoy soulful conversations by the fire.
        •        Nearby Stream & Pine Forests 🌲 – Walkable serenity. Sleep with the sounds of nature, wake up to fresh mountain air.
        •        Pets, Kids, & Heartfelt Moments 🐶👧 – Befriend the resident doggos and local children; they'll leave a lasting impression.

⸻

🛏️ Room Types
        •        Traditional Mountain Cottage 🏔️ – Ideal for couples or solo travelers, with private bathrooms and peaceful surroundings.
        •        Family-Friendly Cottage 🛏️ – For small groups or families, with extra sleeping arrangements and warm interiors.

⸻

🎯 Experiences & Activities
        •        Guided Village Trek & Story Walks 🥾 – Discover heritage, humor, and history from a local's perspective.
        •        Tea Garden Exploration 🍃 – Wander through the quiet remnants of a bygone tea estate.
        •        Evenings by the Fire 🔥 – Share stories, sing, or simply soak in the stillness under a starlit sky.
        •        Birdwatching & Photography 📸 – A haven for nature lovers and mindful travelers.
        •        Cultural Exchange & Local Language Lessons 💬 – Learn a Lepcha word or two, and maybe teach a few of your own.

⸻

📍 Getting There
        •        Bagdogra Airport – 70 km ✈️
        •        New Jalpaiguri (NJP) – 65 km 🚉
        •        Darjeeling – 50 km 🚗
        •        Kalimpong – 40 km 🚙

⸻

Other Things to Note
This place isn't just a stay—it's a feeling. No donation box here. But every meal you eat, every night you stay, and every smile you share contributes"

Now generate a similar listing for the following reviews. Extract key themes, amenities, experiences, and sentiments from the reviews to create an authentic, compelling Airbnb listing:`;

export async function POST(request: NextRequest) {
  try {
    const { reviews, rating, totalReviews, placeName } = await request.json();

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: "Reviews are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Format reviews for the prompt
    const reviewsText = reviews
      .map((review: PlaceReview) => {
        return `- "${review.text}" (Rating: ${review.rating}/5, by ${review.author_name})`;
      })
      .join("\n\n");

    const contextInfo = `
Place Rating: ${rating || "N/A"}/5
Total Reviews: ${totalReviews || reviews.length}

Reviews:
${reviewsText}
`;

    const fullPrompt = `${AIRBNB_PROMPT}

${contextInfo}

Remember:
- Do NOT use the actual place name "${placeName || "the property"}" in the title or description
- Create a compelling, SEO-friendly title
- Use the exact format structure from the sample
- Extract real quotes from the reviews provided
- Infer amenities and experiences from what reviewers mention
- Keep the warm, inviting tone
- AVOID generic overused terms like: serene, tranquil, nestled, tucked away, hidden gem, oasis, paradise, picturesque, quaint, idyllic, breathtaking, stunning, magical, enchanting, escape, retreat, getaway, rejuvenate, unwind
- Instead use SPECIFIC, CONCRETE descriptions from the actual reviews - mention real details like specific birds, rivers, tea gardens, food items, activities that guests actually experienced
- Be authentic and grounded, not flowery or cliché
- USE THE ACTUAL WORDS AND PHRASES from the reviews as much as possible - if a guest says "addictive tea" use that exact phrase, if they mention "village walk" or "range officer" include those specific terms
- Mirror the voice and language of real guests to keep it authentic
- Include Airbnb SEO keywords naturally: location-specific terms, property type (cottage, bungalow, guest house), nearby attractions, experience types (eco-tourism, nature stay, homestay), amenities mentioned
- Use searchable terms guests would type: "near [landmark]", "[activity] in [region]", "family-friendly", "couples", "solo travelers", "pet-friendly" if applicable`;

    // Use Gemini 2.0 Flash Lite - the cheapest model available
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiData.error.message}` },
        { status: 400 }
      );
    }

    const generatedText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description: generatedText,
      model: "gemini-2.0-flash-lite",
      reviewsUsed: reviews.length,
    });
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
