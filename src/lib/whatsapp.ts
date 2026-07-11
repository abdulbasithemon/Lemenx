import { prisma } from "./db";

const MAX_ATTEMPTS = 3;

/**
 * Sends a WhatsApp message through the configured provider and logs the
 * result in whatsapp_logs. Providers: mock (default), twilio, meta.
 * Never throws — a failed notification must not break the main flow.
 */
export async function sendWhatsAppMessage(
  phoneNumber: string | null | undefined,
  message: string,
  userId?: number
): Promise<boolean> {
  if (!phoneNumber) return false;
  const provider = process.env.WHATSAPP_PROVIDER || "mock";

  let sent = false;
  let apiResponse = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !sent; attempt++) {
    try {
      if (provider === "twilio") {
        apiResponse = await sendViaTwilio(phoneNumber, message);
      } else if (provider === "meta") {
        apiResponse = await sendViaMeta(phoneNumber, message);
      } else {
        console.log(`[whatsapp:mock] to=${phoneNumber} message="${message}"`);
        apiResponse = "mock: logged to console";
      }
      sent = true;
    } catch (e) {
      apiResponse = e instanceof Error ? e.message : String(e);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  await prisma.whatsappLog
    .create({
      data: {
        userId: userId ?? null,
        phoneNumber,
        message,
        status: sent ? "sent" : "failed",
        apiResponse: apiResponse.slice(0, 2000),
      },
    })
    .catch((e) => console.error("whatsapp log failed", e));

  return sent;
}

async function sendViaTwilio(to: string, body: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) throw new Error("Twilio env vars not configured");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      Body: body,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${text}`);
  return text;
}

async function sendViaMeta(to: string, body: string): Promise<string> {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error("Meta WhatsApp env vars not configured");

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^\d+]/g, ""),
      type: "text",
      text: { body },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta ${res.status}: ${text}`);
  return text;
}
