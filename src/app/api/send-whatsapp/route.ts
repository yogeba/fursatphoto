import { NextRequest, NextResponse } from "next/server";

interface SendRequest {
  destination: string;       // Phone number with country code e.g. "919876543210"
  dates: string;             // e.g. "21-24 June"
  guestCount: string;        // e.g. "15"
}

interface BulkSendRequest {
  messages: SendRequest[];
}

interface SendResult {
  destination: string;
  messageId?: string;
  status: "submitted" | "failed";
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey = process.env.GUPSHUP_API_KEY;
    const appName = process.env.GUPSHUP_APP_NAME;
    const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER;
    const templateId = process.env.GUPSHUP_TEMPLATE_ID;

    if (!apiKey || !appName || !sourceNumber || !templateId) {
      return NextResponse.json(
        { error: "Gupshup env vars not configured (GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER, GUPSHUP_TEMPLATE_ID)" },
        { status: 500 }
      );
    }

    // Support single message or bulk
    const messages: SendRequest[] = body.messages || [body];

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages to send" }, { status: 400 });
    }

    // Validate all messages
    for (const msg of messages) {
      if (!msg.destination || !msg.dates || !msg.guestCount) {
        return NextResponse.json(
          { error: `Each message needs destination, dates, guestCount. Got: ${JSON.stringify(msg)}` },
          { status: 400 }
        );
      }
    }

    // Send all messages (respect 20/sec rate limit — sequential is fine for now)
    const results: SendResult[] = [];

    for (const msg of messages) {
      try {
        const result = await sendTemplate(
          apiKey, appName, sourceNumber, templateId,
          msg.destination, [msg.dates, msg.guestCount]
        );
        results.push({
          destination: msg.destination,
          messageId: result.messageId,
          status: "submitted",
        });
      } catch (e) {
        results.push({
          destination: msg.destination,
          status: "failed",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const submitted = results.filter(r => r.status === "submitted").length;
    const failed = results.filter(r => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      sent: submitted,
      failed,
      total: messages.length,
      results,
    });
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendTemplate(
  apiKey: string,
  appName: string,
  sourceNumber: string,
  templateId: string,
  destination: string,
  params: string[]
): Promise<{ messageId: string }> {
  // Clean phone number — remove +, spaces, dashes
  const cleanDest = destination.replace(/[\s+\-()]/g, "");

  const formData = new URLSearchParams({
    source: sourceNumber,
    destination: cleanDest,
    "src.name": appName,
    template: JSON.stringify({
      id: templateId,
      params,
    }),
  });

  const response = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: apiKey,
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(data.message || `Gupshup API error: ${response.status}`);
  }

  return { messageId: data.messageId };
}
