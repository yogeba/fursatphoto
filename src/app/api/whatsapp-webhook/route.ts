import { NextRequest, NextResponse } from "next/server";

// Gupshup webhook payload types
interface GupshupMessageEvent {
  app: string;
  timestamp: number;
  version: number;
  type: "message" | "message-event";
  payload: {
    id: string;
    source: string;
    type: string;
    payload: {
      text?: string;
      url?: string;
      caption?: string;
      filename?: string;
    };
    sender: {
      phone: string;
      name: string;
      country_code: string;
      dial_code: string;
    };
    context?: {
      id: string;
      gsId: string;
    };
  };
}

interface GupshupStatusEvent {
  app: string;
  timestamp: number;
  type: "message-event";
  payload: {
    id: string;
    type: string;  // enqueued, sent, delivered, read, failed
    destination: string;
    gsId: string;
  };
}

// Store recent messages in memory (for dev/debugging — production would use a DB)
const recentMessages: Array<{
  timestamp: string;
  phone: string;
  name: string;
  type: string;
  text?: string;
  mediaUrl?: string;
}> = [];
const MAX_STORED = 100;

export async function POST(request: NextRequest) {
  // Gupshup requires immediate 200 response — process async
  try {
    const body = await request.json();

    // Log everything for debugging
    console.log("[WhatsApp Webhook]", JSON.stringify(body, null, 2));

    if (body.type === "message") {
      const event = body as GupshupMessageEvent;
      const sender = event.payload.sender;
      const msgType = event.payload.type;
      const msgPayload = event.payload.payload;

      const entry = {
        timestamp: new Date(event.timestamp).toISOString(),
        phone: sender.phone,
        name: sender.name,
        type: msgType,
        text: msgPayload.text,
        mediaUrl: msgPayload.url,
      };

      // Store in memory
      recentMessages.unshift(entry);
      if (recentMessages.length > MAX_STORED) recentMessages.pop();

      console.log(`[WhatsApp] Inbound from ${sender.phone} (${sender.name}): ${msgType} — ${msgPayload.text || msgPayload.url || "(media)"}`);

      // TODO Phase 4: Match phone to Targets sheet, trigger onboard-property pipeline
      // For now, just log and store

    } else if (body.type === "message-event") {
      const event = body as GupshupStatusEvent;
      console.log(`[WhatsApp] Status: ${event.payload.type} for ${event.payload.destination} (msg ${event.payload.id})`);
    }
  } catch (error) {
    // Log but don't fail — Gupshup retries on non-200
    console.error("[WhatsApp Webhook] Parse error:", error);
  }

  // Always return 200 with empty body — Gupshup requirement
  return new NextResponse("", { status: 200 });
}

// GET endpoint to check recent messages (for debugging/monitoring)
export async function GET() {
  return NextResponse.json({
    count: recentMessages.length,
    messages: recentMessages.slice(0, 20),
  });
}
