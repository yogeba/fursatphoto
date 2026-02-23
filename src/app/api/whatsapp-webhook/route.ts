import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Store webhook events in MongoDB so they survive Vercel cold starts
async function storeEvent(event: Record<string, unknown>) {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.warn("[Webhook] No DATABASE_URL — event not persisted");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    await db.collection("webhook_events").insertOne({
      ...event,
      receivedAt: new Date(),
    });
  } catch (e) {
    console.error("[Webhook] MongoDB store error:", e);
  } finally {
    await client.close();
  }
}

async function getRecentEvents(limit = 20) {
  const uri = process.env.DATABASE_URL;
  if (!uri) return [];
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    return await db.collection("webhook_events")
      .find({})
      .sort({ receivedAt: -1 })
      .limit(limit)
      .toArray();
  } catch (e) {
    console.error("[Webhook] MongoDB read error:", e);
    return [];
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[WhatsApp Webhook] Raw:", JSON.stringify(body));

    // Detect format and normalize
    // Meta v3 format: { object: "whatsapp_business_account", entry: [...] }
    // Gupshup v2 format: { app, timestamp, type: "message" | "message-event", payload: {...} }

    if (body.object === "whatsapp_business_account" && body.entry) {
      // Meta v3 format
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value || {};

          // Status updates (sent, delivered, read, failed)
          for (const status of value.statuses || []) {
            const event = {
              format: "meta_v3",
              eventType: "status",
              status: status.status, // sent, delivered, read, failed
              recipientId: status.recipient_id,
              messageId: status.id,
              timestamp: status.timestamp,
              errors: status.errors,
            };
            console.log(`[WhatsApp] Status: ${status.status} for ${status.recipient_id}`);
            await storeEvent(event);
          }

          // Inbound messages
          for (const message of value.messages || []) {
            const contact = (value.contacts || [])[0] || {};
            const event = {
              format: "meta_v3",
              eventType: "message",
              phone: message.from,
              name: contact.profile?.name || "",
              messageType: message.type,
              text: message.text?.body || message.button?.text || "",
              mediaUrl: message.image?.id || message.document?.id || "",
              timestamp: message.timestamp,
            };
            console.log(`[WhatsApp] Inbound from ${message.from}: ${message.type} — ${event.text || "(media)"}`);
            await storeEvent(event);
          }
        }
      }
    } else if (body.type === "message" || body.type === "message-event") {
      // Gupshup v2 format
      if (body.type === "message") {
        const sender = body.payload?.sender || {};
        const msgPayload = body.payload?.payload || {};
        const event = {
          format: "gupshup_v2",
          eventType: "message",
          phone: sender.phone,
          name: sender.name,
          messageType: body.payload?.type,
          text: msgPayload.text,
          mediaUrl: msgPayload.url,
          timestamp: new Date(body.timestamp).toISOString(),
        };
        console.log(`[WhatsApp] Inbound from ${sender.phone}: ${body.payload?.type} — ${msgPayload.text || "(media)"}`);
        await storeEvent(event);
      } else if (body.type === "message-event") {
        const event = {
          format: "gupshup_v2",
          eventType: "status",
          status: body.payload?.type,
          recipientId: body.payload?.destination,
          messageId: body.payload?.id,
          gsId: body.payload?.gsId,
          timestamp: new Date(body.timestamp).toISOString(),
        };
        console.log(`[WhatsApp] Status: ${body.payload?.type} for ${body.payload?.destination}`);
        await storeEvent(event);
      }
    } else {
      // Unknown format — store raw for debugging
      await storeEvent({ format: "unknown", raw: body });
      console.log("[WhatsApp Webhook] Unknown format:", JSON.stringify(body));
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Parse error:", error);
  }

  // Always return 200 — Gupshup/Meta retries on non-200
  return new NextResponse("", { status: 200 });
}

// GET endpoint to check recent events (debugging/monitoring)
export async function GET() {
  const events = await getRecentEvents(20);
  return NextResponse.json({
    count: events.length,
    events: events.map(e => {
      const { _id, ...rest } = e;
      return rest;
    }),
  });
}
